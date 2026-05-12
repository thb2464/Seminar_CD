import json
from contextlib import asynccontextmanager
from typing import Any

import pytest

from app.services.event_consumer import CatalogEventConsumer


class FakeReindexer:
    def __init__(self) -> None:
        self.reindex_calls: list[tuple[str, str, str]] = []
        self.remove_calls: list[tuple[str, str, str]] = []
        self.raises: Exception | None = None

    async def reindex_tour(self, document_id: str, locale: str, slug: str) -> int:
        if self.raises:
            raise self.raises
        self.reindex_calls.append((document_id, locale, slug))
        return 4

    async def remove_tour(self, document_id: str, locale: str, slug: str) -> int:
        if self.raises:
            raise self.raises
        self.remove_calls.append((document_id, locale, slug))
        return 4


class FakeMessage:
    def __init__(self, body: dict[str, Any] | bytes) -> None:
        if isinstance(body, dict):
            self.body = json.dumps(body).encode("utf-8")
        else:
            self.body = body
        self.processed: list[bool] = []
        self.requeue_seen: list[bool] = []

    @asynccontextmanager
    async def process(self, *, requeue: bool = False):
        self.requeue_seen.append(requeue)
        yield self
        self.processed.append(True)


def _envelope(event_type: str, **payload_overrides: Any) -> dict[str, Any]:
    payload = {
        "id": 42,
        "documentId": "doc-42",
        "locale": "vi",
        "slug": "hue-tour",
        "tourName": "Hue Tour",
        "region": "MienTrung",
        "isFeatured": True,
        "updatedAt": "2026-05-12T10:00:00Z",
    }
    payload.update(payload_overrides)
    return {
        "type": event_type,
        "occurredAt": "2026-05-12T10:00:00Z",
        "service": "catalog-service",
        "payload": payload,
    }


async def test_handle_tour_updated_triggers_reindex() -> None:
    reindexer = FakeReindexer()
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(_envelope("TourUpdated"))

    await consumer._handle(message, is_delete=False)  # type: ignore[arg-type]

    assert reindexer.reindex_calls == [("doc-42", "vi", "hue-tour")]
    assert reindexer.remove_calls == []
    assert message.processed == [True]


async def test_handle_tour_deleted_triggers_remove() -> None:
    reindexer = FakeReindexer()
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(_envelope("TourDeleted"))

    await consumer._handle(message, is_delete=True)  # type: ignore[arg-type]

    assert reindexer.remove_calls == [("doc-42", "vi", "hue-tour")]
    assert reindexer.reindex_calls == []


async def test_handle_skips_unknown_event_type() -> None:
    reindexer = FakeReindexer()
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(_envelope("SomethingElse"))

    await consumer._handle(message, is_delete=False)  # type: ignore[arg-type]
    assert reindexer.reindex_calls == []
    assert reindexer.remove_calls == []


async def test_handle_skips_envelope_without_slug() -> None:
    reindexer = FakeReindexer()
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(_envelope("TourUpdated", slug=""))

    await consumer._handle(message, is_delete=False)  # type: ignore[arg-type]
    assert reindexer.reindex_calls == []


async def test_handle_swallows_invalid_json() -> None:
    reindexer = FakeReindexer()
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(b"not-json")
    await consumer._handle(message, is_delete=False)  # type: ignore[arg-type]
    assert reindexer.reindex_calls == []


async def test_handle_swallows_reindex_errors() -> None:
    reindexer = FakeReindexer()
    reindexer.raises = RuntimeError("vector store down")
    consumer = CatalogEventConsumer("amqp://x", "catalog.events", reindexer)
    message = FakeMessage(_envelope("TourUpdated"))
    # Should not raise — message.process() returns control to the handler.
    await consumer._handle(message, is_delete=False)  # type: ignore[arg-type]
    assert message.processed == [True]


async def test_start_is_noop_without_url() -> None:
    consumer = CatalogEventConsumer("", "catalog.events", FakeReindexer())
    await consumer.start()
    assert consumer.is_running is False


@pytest.mark.asyncio
async def test_stop_is_idempotent_when_not_started() -> None:
    consumer = CatalogEventConsumer("", "catalog.events", FakeReindexer())
    await consumer.stop()
    assert consumer.is_running is False
