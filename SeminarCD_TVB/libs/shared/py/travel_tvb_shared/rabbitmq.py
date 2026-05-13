from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol, TypeVar
from uuid import uuid4

TPayload = TypeVar("TPayload")


@dataclass(frozen=True)
class EventEnvelope:
    event_id: str
    event_type: str
    occurred_at: str
    trace_id: str
    payload: Mapping[str, Any]


class ExchangeLike(Protocol):
    async def publish(self, message: Any, routing_key: str) -> None:
        ...


class MessageFactory(Protocol):
    def __call__(self, body: bytes, **kwargs: Any) -> Any:
        ...


def create_event_envelope(
    event_type: str,
    payload: Mapping[str, Any],
    trace_id: str,
    event_id: str | None = None,
) -> EventEnvelope:
    return EventEnvelope(
        event_id=event_id or str(uuid4()),
        event_type=event_type,
        occurred_at=datetime.now(UTC).isoformat(),
        trace_id=trace_id,
        payload=payload,
    )


def encode_event(event: EventEnvelope) -> bytes:
    return json.dumps(
        {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "occurred_at": event.occurred_at,
            "trace_id": event.trace_id,
            "payload": event.payload,
        },
        separators=(",", ":"),
    ).encode("utf-8")


def decode_event(body: bytes) -> EventEnvelope:
    decoded = json.loads(body.decode("utf-8"))

    return EventEnvelope(
        event_id=decoded["event_id"],
        event_type=decoded["event_type"],
        occurred_at=decoded["occurred_at"],
        trace_id=decoded["trace_id"],
        payload=decoded["payload"],
    )


async def publish_json_event(
    exchange: ExchangeLike,
    message_factory: MessageFactory,
    routing_key: str,
    event: EventEnvelope,
) -> None:
    message = message_factory(
        encode_event(event),
        content_type="application/json",
        headers={"event_type": event.event_type, "trace_id": event.trace_id},
        delivery_mode=2,
    )
    await exchange.publish(message, routing_key=routing_key)


async def handle_json_message(
    body: bytes,
    handler: Callable[[EventEnvelope], Awaitable[None]],
) -> None:
    await handler(decode_event(body))
