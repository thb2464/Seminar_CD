# Phase 2 - Task 02: Data Ownership And API Dependencies

## User Prompt

```text
Define the data ownership matrix for Travel TVB.
Show which service owns each entity and how other services access it.
Also create the API and event dependency graph.
```

## AI Understanding

AI understood that the system needed database-per-service discipline. Cross-service access had to happen through APIs or events, not direct database joins.

## AI Work Report

AI defined data ownership:

- User and role data belongs to Identity Service.
- Tour, category, region, itinerary, highlight, gallery, pricing, and availability data belongs to Catalog Service.
- Booking, contact, status, cancellation, and refund intent data belongs to Booking Service.
- Payment, VNPay transaction, payment callback, and refund transaction data belongs to Payment Service.
- Blog, FAQ, homepage, about, service, layout, contact, and newsletter content belongs to Content Service.
- Chat session, vector document, embedding metadata, and search index data belongs to AI Chatbot Service.

AI defined access patterns:

- Frontend calls all services through the API Gateway.
- Booking Service reads tour availability from Catalog Service.
- Payment Service receives payment intent from booking events.
- Booking Service listens to payment result events.
- AI Chatbot Service consumes catalog update events and refreshes vector chunks.
- Content Service serves public CMS content through gateway routes.

AI defined event dependencies:

- `booking.events`: `BookingCreated`, `BookingCancelled`.
- `payment.events`: `PaymentCompleted`, `PaymentFailed`, `RefundProcessed`.
- `catalog.events`: `TourCreated`, `TourUpdated`, `TourDeleted`.

## Deliverables

- Data ownership matrix.
- Sync API dependency list.
- Async event dependency list.
- Service communication rules.

## Validation Notes

The task was complete when each service had a clear source of truth and every cross-service write could be modeled as an event-driven workflow.

## Next Prompt

```text
Design the high-level Travel TVB architecture, including gateway, services, databases, event broker, and frontend flow.
```
