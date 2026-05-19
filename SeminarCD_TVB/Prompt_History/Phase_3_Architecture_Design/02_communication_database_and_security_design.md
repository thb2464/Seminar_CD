# Phase 3 - Task 02: Communication, Database, And Security Design

## User Prompt

```text
Design the communication patterns, database strategy, authentication propagation, and event workflow for Travel TVB.
```

## AI Understanding

AI understood that the system needed predictable contracts between services. Synchronous calls should be used for user-facing reads, while asynchronous events should protect workflows that cross service ownership boundaries.

## AI Work Report

AI designed communication patterns:

- REST and JSON for frontend-to-service requests through the gateway.
- REST for read-only service-to-service lookups.
- RabbitMQ for cross-service business events.
- Structured JSON logs for every service.
- Trace ID propagation through `X-Trace-Id`.

AI designed database boundaries:

- `identity_db` for Identity Service.
- `catalog_db` for Catalog Service.
- `booking_db` for Booking Service.
- `payment_db` for Payment Service.
- `content_db` for Content Service.
- ChromaDB collections for AI Chatbot vector search.

AI designed authentication:

- Identity Service issues JWTs.
- Gateway validates JWTs for protected routes.
- Gateway injects `X-User-Id`, `X-User-Role`, and `X-Trace-Id`.
- Downstream services trust gateway headers for authorization decisions.

AI designed events:

- Booking publishes booking lifecycle events.
- Payment publishes payment result events.
- Catalog publishes tour change events.
- AI Chatbot consumes tour change events to keep vector search current.

## Deliverables

- Communication design.
- Database-per-service design.
- Authentication propagation rules.
- RabbitMQ event workflow.

## Validation Notes

The task was complete when security, data ownership, and event flow could be implemented without direct database sharing.

## Next Prompt

```text
Design the frontend integration flow and user-facing error behavior for the Travel TVB application.
```
