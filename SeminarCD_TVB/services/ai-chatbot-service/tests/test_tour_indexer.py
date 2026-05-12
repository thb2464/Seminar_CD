from typing import Any

import pytest

from app.services.tour_indexer import TourIndexer


class FakeCatalogClient:
    def __init__(self, response: dict | None) -> None:
        self.response = response
        self.calls: list[tuple[str, str]] = []

    async def get_tour(self, slug: str, locale: str) -> dict | None:
        self.calls.append((slug, locale))
        return self.response


class FakeVectorStore:
    def __init__(self) -> None:
        self.added: list[Any] = []
        self.deleted_ids: list[str] = []

    async def add_documents(self, docs: list[Any]) -> int:
        self.added.extend(docs)
        return len(docs)

    async def _collection_ref(self) -> Any:
        return self

    async def client_delete(self, _collection: Any, ids: list[str]) -> None:
        self.deleted_ids.extend(ids)


def _tour_fixture(slug: str = "hue-tour") -> dict:
    return {
        "id": 10,
        "attributes": {
            "Tour_Name": "Hue Tour",
            "slug": slug,
            "Short_Description": "Walk",
            "Location": "Hue",
            "Region": "MienTrung",
            "Price": 2_000_000,
            "Duration_Days": 3,
            "Duration_Nights": 2,
            "Highlights": [{"Title": "Citadel", "Description": "Imperial walk"}],
            "Itinerary": [{"type": "paragraph", "children": [{"text": "Day 1"}]}],
            "Description": [{"type": "paragraph", "children": [{"text": "X"}]}],
        },
    }


async def test_reindex_tour_calls_catalog_and_upserts() -> None:
    catalog = FakeCatalogClient({"data": _tour_fixture()})
    vstore = FakeVectorStore()
    indexer = TourIndexer(catalog, vstore)  # type: ignore[arg-type]

    inserted = await indexer.reindex_tour("doc-1", "vi", "hue-tour")

    assert catalog.calls == [("hue-tour", "vi")]
    assert inserted == len(vstore.added)
    assert vstore.added, "expected at least one document inserted"


async def test_reindex_falls_back_to_remove_when_catalog_404() -> None:
    catalog = FakeCatalogClient(None)
    vstore = FakeVectorStore()
    indexer = TourIndexer(catalog, vstore)  # type: ignore[arg-type]

    removed = await indexer.reindex_tour("doc-1", "vi", "missing-slug")

    assert removed == 4
    assert vstore.deleted_ids == [
        "vi::missing-slug::overview",
        "vi::missing-slug::description",
        "vi::missing-slug::highlights",
        "vi::missing-slug::itinerary",
    ]


async def test_remove_tour_deletes_all_four_chunk_ids() -> None:
    catalog = FakeCatalogClient(None)
    vstore = FakeVectorStore()
    indexer = TourIndexer(catalog, vstore)  # type: ignore[arg-type]

    affected = await indexer.remove_tour("doc-1", "en", "old-tour")
    assert affected == 4
    assert vstore.deleted_ids == [
        "en::old-tour::overview",
        "en::old-tour::description",
        "en::old-tour::highlights",
        "en::old-tour::itinerary",
    ]
