import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Protocol

from app.services.gemini import GeminiClient

logger = logging.getLogger(__name__)

_INTER_REQUEST_DELAY_SECONDS = 1.0
_DEFAULT_BATCH_SIZE = 5


@dataclass(frozen=True)
class VectorDocument:
    id: str
    content: str
    metadata: dict[str, Any]


@dataclass(frozen=True)
class VectorSearchHit:
    content: str
    metadata: dict[str, Any]
    distance: float


class ChromaCollection(Protocol):
    def query(
        self,
        query_embeddings: list[list[float]],
        n_results: int,
        where: dict[str, Any] | None = ...,
    ) -> dict[str, Any]: ...

    def upsert(
        self,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None: ...


class ChromaClientLike(Protocol):
    def get_or_create_collection(
        self,
        name: str,
        metadata: dict[str, Any] | None = ...,
    ) -> ChromaCollection: ...

    def delete_collection(self, name: str) -> None: ...


class VectorStore:
    """ChromaDB + Gemini embeddings wrapper.

    Mirrors the monolith's `vectorStore.js` behaviour:
      - lazy `get_or_create_collection` of `tour_embeddings`
      - language-filtered `search` with English fallback and unfiltered final fallback
      - `add_documents` chunks into batches of 5 with a 1-second inter-request delay
      - `clear_collection` deletes and recreates the collection
    """

    def __init__(
        self,
        chroma_client: ChromaClientLike,
        gemini: GeminiClient,
        collection_name: str,
        batch_size: int = _DEFAULT_BATCH_SIZE,
    ) -> None:
        self._client = chroma_client
        self._gemini = gemini
        self._collection_name = collection_name
        self._batch_size = batch_size
        self._collection: ChromaCollection | None = None
        self._lock = asyncio.Lock()

    async def _collection_ref(self) -> ChromaCollection:
        if self._collection is not None:
            return self._collection
        async with self._lock:
            if self._collection is None:
                self._collection = await asyncio.to_thread(
                    self._client.get_or_create_collection,
                    self._collection_name,
                    {"description": "Tour data embeddings for RAG chatbot"},
                )
        return self._collection

    async def search(
        self,
        query: str,
        n_results: int = 5,
        language: str = "vi",
    ) -> list[VectorSearchHit]:
        collection = await self._collection_ref()
        embedding = await self._gemini.embed(query)

        result = await asyncio.to_thread(
            collection.query,
            [embedding],
            n_results,
            {"language": language},
        )
        if _no_hits(result) and language != "en":
            logger.info(
                "vector store falling back to English",
                extra={"requested_language": language},
            )
            result = await asyncio.to_thread(
                collection.query,
                [embedding],
                n_results,
                {"language": "en"},
            )
        if _no_hits(result):
            logger.info("vector store falling back to unfiltered search")
            result = await asyncio.to_thread(
                collection.query,
                [embedding],
                n_results,
                None,
            )

        return _to_hits(result)

    async def add_documents(self, documents: list[VectorDocument]) -> int:
        if not documents:
            return 0
        collection = await self._collection_ref()
        total = 0
        for chunk in _chunked(documents, self._batch_size):
            texts = [doc.content for doc in chunk]
            embeddings = await self._embed_batch(texts)
            await asyncio.to_thread(
                collection.upsert,
                [doc.id for doc in chunk],
                texts,
                embeddings,
                [doc.metadata for doc in chunk],
            )
            total += len(chunk)
            logger.info(
                "vector store batch upserted",
                extra={"batch_size": len(chunk), "total_so_far": total},
            )
        return total

    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for index, text in enumerate(texts):
            embeddings.append(await self._gemini.embed(text))
            if index < len(texts) - 1:
                await asyncio.sleep(_INTER_REQUEST_DELAY_SECONDS)
        return embeddings

    async def clear_collection(self) -> None:
        await asyncio.to_thread(self._client.delete_collection, self._collection_name)
        self._collection = await asyncio.to_thread(
            self._client.get_or_create_collection,
            self._collection_name,
            {"description": "Tour data embeddings for RAG chatbot"},
        )
        logger.info("vector store cleared", extra={"collection": self._collection_name})


def _no_hits(result: dict[str, Any]) -> bool:
    documents = result.get("documents") if isinstance(result, dict) else None
    if not documents:
        return True
    first = documents[0]
    return not first


def _to_hits(result: dict[str, Any]) -> list[VectorSearchHit]:
    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    hits: list[VectorSearchHit] = []
    for index, content in enumerate(documents):
        hits.append(
            VectorSearchHit(
                content=content,
                metadata=metadatas[index] if index < len(metadatas) else {},
                distance=float(distances[index]) if index < len(distances) else 0.0,
            )
        )
    return hits


def _chunked(items: list[VectorDocument], size: int) -> list[list[VectorDocument]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def build_chroma_client(host: str, port: int, ssl: bool) -> ChromaClientLike:
    import chromadb

    return chromadb.HttpClient(host=host, port=port, ssl=ssl)  # type: ignore[return-value]
