# RabbitMQ Topology

The local RabbitMQ container loads `definitions.json` at startup.

## Exchanges

All domain events use durable topic exchanges:

- `booking.events` - `BookingCreated`, `BookingCancelled`
- `catalog.events` - `TourCreated`, `TourUpdated`, `TourDeleted`
- `payment.events` - `PaymentCompleted`, `PaymentFailed`, `RefundProcessed`

## Queue Naming

Use the pattern:

```text
<consumer_service>_<source_domain>_events
```

Examples:

- `payment_service_booking_events` receives booking events consumed by Payment Service.
- `booking_service_payment_events` receives payment events consumed by Booking Service.
- `chatbot.catalog.tour-changed` receives `TourCreated` and `TourUpdated` for chatbot re-indexing.
- `chatbot.catalog.tour-deleted` receives `TourDeleted` for chatbot vector deletion.

Queues are durable. Consumers should acknowledge only after the local state transition or re-index operation succeeds. Malformed messages should be rejected without requeue and sent to dead-letter handling once a DLQ feature is added.

## Routing Keys

Routing keys are event type names in PascalCase. Prefer exact bindings (`PaymentCompleted`) over broad wildcards unless a consumer truly handles every event from a domain.
