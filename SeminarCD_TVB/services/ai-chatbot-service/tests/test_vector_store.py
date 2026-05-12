from typing import Any

import pytest

from app.services.vector_store import VectorDocument, VectorStore


class FakeCollection:
    def __init__(self) -> None:
        self.upserts: list[dict[str, Any]] = []
        self.queries: list[dict[str, Any]] = []
        self.responses: list[dict[str, Any]] = []

    def queue(self, response: dict[str, Any]) -> None:
        self.responses.append(response)

    def query(
        self,
        query_embeddings: list[list[float]],
        n_results: int,
        where: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self.queries.append({"embeddings": query_embeddings, "n_results": n_results, "where": where})
        return self.responses.pop(0)

    def upsert(
        self,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        self.upserts.append(
            {"ids": ids, "documents": documents, "embeddings": embeddings, "metadatas": metadatas}
        )


class FakeChromaClient:
    def __init__(self, collection: FakeCollection) -> None:
        self.collection = collection
        self.delete_calls: list[str] = []
        self.create_calls: list[str] = []

    def get_or_create_collection(
        self,
        name: str,
        metadata: dict[str, Any] | None = None,
    ) -> FakeCollection:
        self.create_calls.append(name)
        return self.collection

    def delete_collection(self, name: str) -> None:
        self.delete_calls.append(name)


class FakeGemini:
    def __init__(self, embedding: list[float]) -> None:
        self.embedding = embedding
        self.embed_calls: list[str] = []

    async def embed(self, text: str) -> list[float]:
        self.embed_calls.append(text)
        return list(self.embedding)

    async def generate(
        self,
        system_prompt: str,
        history: list[dict[str, object]],
        message: str,
    ) -> str:
        return ""


@pytest.fixture
def store() -> tuple[VectorStore, FakeCollection, FakeChromaClient, FakeGemini]:
    collection = FakeCollection()
    client = FakeChromaClient(collection)
    gemini = FakeGemini([0.1, 0.2, 0.3])
    return VectorStore(client, gemini, "tour_embeddings", batch_size=2), collection, client, gemini


def _response(documents: list[str], metadatas: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    metas = metadatas or [{"language": "vi"}] * len(documents)
    return {
        "documents": [documents],
        "metadatas": [metas],
        "distances": [[0.1] * len(documents)],
    }


async def test_search_returns_hits_with_metadata(store: Any) -> None:
    vstore, collection, _, _ = store
    collection.queue(_response(["A tour in Hanoi"], [{"tourSlug": "hanoi"}]))

    hits = await vstore.search("Hanoi", n_results=1, language="vi")

    assert len(hits) == 1
    assert hits[0].content == "A tour in Hanoi"
    assert hits[0].metadata["tourSlug"] == "hanoi"
    assert collection.queries[0]["where"] == {"language": "vi"}


async def test_search_falls_back_to_english(store: Any) -> None:
    vstore, collection, _, _ = store
    collection.queue(_response([]))
    collection.queue(_response(["English match"]))

    hits = await vstore.search("Hue", language="vi")

    assert [q["where"] for q in collection.queries] == [{"language": "vi"}, {"language": "en"}]
    assert hits[0].content == "English match"


async def test_search_falls_back_to_unfiltered(store: Any) -> None:
    vstore, collection, _, _ = store
    collection.queue(_response([]))
    collection.queue(_response([]))
    collection.queue(_response(["Any language"]))

    hits = await vstore.search("Sapa", language="vi")

    assert collection.queries[-1]["where"] is None
    assert hits[0].content == "Any language"


async def test_search_skips_english_fallback_when_already_english(store: Any) -> None:
    vstore, collection, _, _ = store
    collection.queue(_response([]))
    collection.queue(_response(["Any language"]))

    await vstore.search("Phong Nha", language="en")

    assert [q["where"] for q in collection.queries] == [{"language": "en"}, None]


async def test_add_documents_chunks_and_embeds(store: Any) -> None:
    vstore, collection, _, gemini = store
    docs = [
        VectorDocument(id=str(i), content=f"chunk {i}", metadata={"language": "vi"})
        for i in range(5)
    ]

    inserted = await vstore.add_documents(docs)

    assert inserted == 5
    assert len(collection.upserts) == 3  # 2 + 2 + 1
    assert gemini.embed_calls == ["chunk 0", "chunk 1", "chunk 2", "chunk 3", "chunk 4"]


async def test_add_documents_noop_when_empty(store: Any) -> None:
    vstore, collection, _, _ = store
    assert await vstore.add_documents([]) == 0
    assert collection.upserts == []


async def test_clear_collection_deletes_and_recreates(store: Any) -> None:
    vstore, _, client, _ = store
    await vstore.clear_collection()
    assert client.delete_calls == ["tour_embeddings"]
    assert client.create_calls[-1] == "tour_embeddings"
