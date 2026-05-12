"""RabbitMQ consumer that keeps ChromaDB in sync with catalog.events.

Bindings:
  catalog.events  -- TourCreated  --> chatbot.catalog.tour-changed
  catalog.events  -- TourUpdated  --> chatbot.catalog.tour-changed
  catalog.events  -- TourDeleted  --> chatbot.catalog.tour-deleted

The consumer is started by the FastAPI lifespan and stopped on shutdown. If
RABBITMQ_URL is empty the consumer is a no-op so local dev still boots without
a broker.
"""

import asyncio
import json
import logging
from typing import Any, Protocol

import aio_pika

logger = logging.getLogger(__name__)

_TOUR_CREATED = "TourCreated"
_TOUR_UPDATED = "TourUpdated"
_TOUR_DELETED = "TourDeleted"
_REINDEX_TYPES = {_TOUR_CREATED, _TOUR_UPDATED}

_QUEUE_REINDEX = "chatbot.catalog.tour-changed"
_QUEUE_DELETE = "chatbot.catalog.tour-deleted"


class TourReindexer(Protocol):
    async def reindex_tour(self, document_id: str, locale: str, slug: str) -> int: ...

    async def remove_tour(self, document_id: str, locale: str, slug: str) -> int: ...


class CatalogEventConsumer:
    def __init__(
        self,
        rabbitmq_url: str,
        exchange_name: str,
        reindexer: TourReindexer,
    ) -> None:
        self._url = rabbitmq_url
        self._exchange_name = exchange_name
        self._reindexer = reindexer
        self._connection: aio_pika.RobustConnection | None = None
        self._channel: aio_pika.RobustChannel | None = None
        self._consumer_tags: list[str] = []
        self._started = False

    @property
    def is_running(self) -> bool:
        return self._started

    async def start(self) -> None:
        if not self._url:
            logger.warning("RABBITMQ_URL not set — catalog event consumer disabled")
            return
        if self._started:
            return
        self._connection = await aio_pika.connect_robust(self._url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=8)

        exchange = await self._channel.declare_exchange(
            self._exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )

        reindex_queue = await self._channel.declare_queue(_QUEUE_REINDEX, durable=True)
        await reindex_queue.bind(exchange, routing_key=_TOUR_CREATED)
        await reindex_queue.bind(exchange, routing_key=_TOUR_UPDATED)

        delete_queue = await self._channel.declare_queue(_QUEUE_DELETE, durable=True)
        await delete_queue.bind(exchange, routing_key=_TOUR_DELETED)

        self._consumer_tags.append(await reindex_queue.consume(self._on_reindex_message))
        self._consumer_tags.append(await delete_queue.consume(self._on_delete_message))
        self._started = True
        logger.info(
            "catalog event consumer started",
            extra={"exchange": self._exchange_name, "queues": [_QUEUE_REINDEX, _QUEUE_DELETE]},
        )

    async def stop(self) -> None:
        if not self._started:
            return
        if self._channel is not None:
            try:
                await self._channel.close()
            except Exception:  # pragma: no cover - best-effort shutdown
                logger.exception("channel close failed")
        if self._connection is not None:
            try:
                await self._connection.close()
            except Exception:  # pragma: no cover
                logger.exception("connection close failed")
        self._channel = None
        self._connection = None
        self._consumer_tags = []
        self._started = False

    async def _on_reindex_message(self, message: aio_pika.abc.AbstractIncomingMessage) -> None:
        await self._handle(message, is_delete=False)

    async def _on_delete_message(self, message: aio_pika.abc.AbstractIncomingMessage) -> None:
        await self._handle(message, is_delete=True)

    async def _handle(
        self,
        message: aio_pika.abc.AbstractIncomingMessage,
        *,
        is_delete: bool,
    ) -> None:
        async with message.process(requeue=False):
            envelope = self._parse(message.body)
            if envelope is None:
                logger.warning("dropping unparseable catalog event")
                return
            payload = envelope.get("payload", {}) if isinstance(envelope, dict) else {}
            event_type = envelope.get("type") if isinstance(envelope, dict) else None
            document_id = str(payload.get("documentId", "")) if isinstance(payload, dict) else ""
            locale = str(payload.get("locale", "")) if isinstance(payload, dict) else ""
            slug = str(payload.get("slug", "")) if isinstance(payload, dict) else ""
            if not slug or not locale:
                logger.warning(
                    "dropping event without slug/locale",
                    extra={"event_type": event_type, "documentId": document_id},
                )
                return
            try:
                if is_delete or event_type == _TOUR_DELETED:
                    affected = await self._reindexer.remove_tour(document_id, locale, slug)
                    logger.info(
                        "tour removed from vector store",
                        extra={"slug": slug, "locale": locale, "removed_chunks": affected},
                    )
                elif event_type in _REINDEX_TYPES:
                    affected = await self._reindexer.reindex_tour(document_id, locale, slug)
                    logger.info(
                        "tour reindexed",
                        extra={
                            "slug": slug,
                            "locale": locale,
                            "indexed_chunks": affected,
                            "event_type": event_type,
                        },
                    )
                else:
                    logger.debug("ignoring event type %s", event_type)
            except Exception:
                logger.exception(
                    "catalog event handler failed",
                    extra={"event_type": event_type, "slug": slug, "locale": locale},
                )

    @staticmethod
    def _parse(body: bytes) -> dict[str, Any] | None:
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return None
        return data if isinstance(data, dict) else None


async def shutdown_consumer(consumer: CatalogEventConsumer) -> None:
    """Tiny helper so FastAPI's lifespan can be `await shutdown_consumer(...)`."""
    await asyncio.shield(consumer.stop())
