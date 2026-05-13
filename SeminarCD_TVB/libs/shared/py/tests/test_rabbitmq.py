import unittest

from travel_tvb_shared.rabbitmq import (
    create_event_envelope,
    decode_event,
    encode_event,
    handle_json_message,
    publish_json_event,
)


class RabbitMqTests(unittest.IsolatedAsyncioTestCase):
    def test_encode_and_decode_event(self) -> None:
        event = create_event_envelope("TourUpdated", {"id": 1}, "trace-1", event_id="event-1")

        decoded = decode_event(encode_event(event))

        self.assertEqual(decoded.event_id, "event-1")
        self.assertEqual(decoded.event_type, "TourUpdated")
        self.assertEqual(decoded.payload["id"], 1)

    async def test_publish_json_event(self) -> None:
        exchange = FakeExchange()
        event = create_event_envelope("BookingCreated", {"id": 2}, "trace-2", event_id="event-2")

        await publish_json_event(exchange, FakeMessage, "BookingCreated", event)

        self.assertEqual(exchange.routing_key, "BookingCreated")
        self.assertEqual(exchange.message.headers["event_type"], "BookingCreated")

    async def test_handle_json_message(self) -> None:
        event = create_event_envelope("PaymentCompleted", {"id": 3}, "trace-3", event_id="event-3")
        handled = []

        async def handler(payload):
            handled.append(payload)

        await handle_json_message(encode_event(event), handler)

        self.assertEqual(handled[0].event_type, "PaymentCompleted")


class FakeMessage:
    def __init__(self, body, **kwargs):
        self.body = body
        self.headers = kwargs["headers"]
        self.content_type = kwargs["content_type"]
        self.delivery_mode = kwargs["delivery_mode"]


class FakeExchange:
    def __init__(self) -> None:
        self.message = None
        self.routing_key = None

    async def publish(self, message, routing_key: str) -> None:
        self.message = message
        self.routing_key = routing_key
