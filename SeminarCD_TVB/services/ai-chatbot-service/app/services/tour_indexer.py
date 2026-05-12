"""Single-tour reindex helper used by the event consumer.

Wraps `app.services.vector_store.VectorStore` so the consumer can re-embed one
tour (or remove its chunks) without re-running the whole `python -m
app.scripts.index_tours` job.
"""

import logging
from typing import Protocol

import httpx

from app.scripts.index_tours import to_vector_documents
from app.services.vector_store import VectorStore

logger = logging.getLogger(__name__)


class CatalogClient(Protocol):
    async def get_tour(self, slug: str, locale: str) -> dict | None: ...


class HttpxCatalogClient:
    def __init__(self, base_url: str, api_token: str = "") -> None:
        self._base_url = base_url.rstrip("/")
        self._api_token = api_token

    async def get_tour(self, slug: str, locale: str) -> dict | None:
        headers = {"Authorization": f"Bearer {self._api_token}"} if self._api_token else {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self._base_url}/api/tours/slug/{slug}",
                params={"locale": locale},
                headers=headers,
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()


class TourIndexer:
    def __init__(self, catalog: CatalogClient, vector_store: VectorStore) -> None:
        self._catalog = catalog
        self._vector_store = vector_store

    async def reindex_tour(self, document_id: str, locale: str, slug: str) -> int:
        _ = document_id
        tour = await self._catalog.get_tour(slug, locale)
        if tour is None:
            logger.warning(
                "tour not found in catalog — treating as deletion",
                extra={"slug": slug, "locale": locale},
            )
            return await self.remove_tour(document_id, locale, slug)
        documents = to_vector_documents(tour, locale)
        return await self._vector_store.add_documents(documents)

    async def remove_tour(self, document_id: str, locale: str, slug: str) -> int:
        _ = document_id
        chunk_types = ("overview", "description", "highlights", "itinerary")
        ids = [f"{locale}::{slug}::{chunk}" for chunk in chunk_types]
        try:
            collection = await self._vector_store._collection_ref()  # type: ignore[attr-defined]
            await self._vector_store.client_delete(collection, ids)
            return len(ids)
        except AttributeError:
            logger.warning("vector store does not expose client_delete; skipping removal")
            return 0
