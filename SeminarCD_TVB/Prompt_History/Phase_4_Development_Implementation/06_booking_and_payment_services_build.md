# Phase 4 - Task 06: Booking And Payment Services Build

## User Prompt

```text
Build the Booking Service and Payment Service for Travel TVB.
Booking must support create, list, cancel, and availability.
Payment must support VNPay payment URL creation, callback verification, refunds, events, circuit breaker behavior, and tests.
```

## AI Understanding

AI understood booking and payment as the highest-risk transactional flow. The services needed separate data ownership but a coordinated workflow through events.

## AI Work Report

AI built the Booking Service:

- Created a NestJS service scaffold.
- Added booking, travel date, contact, status, and refund intent models.
- Implemented booking creation.
- Implemented customer booking list.
- Implemented booking cancellation.
- Implemented availability lookup.
- Published `BookingCreated` and `BookingCancelled` events.
- Subscribed to payment result events.
- Updated booking status using a state-machine-style workflow.

AI built the Payment Service:

- Created a NestJS service scaffold.
- Added payment, VNPay transaction, and refund request models.
- Implemented VNPay payment URL generation.
- Implemented VNPay return callback verification with HMAC checking.
- Implemented payment result persistence.
- Published `PaymentCompleted` and `PaymentFailed` events.
- Added refund processing structure.
- Added circuit breaker protection around outbound VNPay calls.

AI added tests:

- Booking controller and service tests.
- Payment service tests.
- VNPay signature tests.
- Event publishing and consuming tests.
- Saga happy-path, failure-path, and timeout-path tests.
- Coverage gates aligned with Booking and Payment targets.

## Deliverables

- Booking Service source code.
- Payment Service source code.
- Booking and payment database models.
- VNPay integration.
- Saga event workflow.
- Circuit breaker behavior.
- Jest and E2E-style tests.

## Validation Notes

The task was complete when a customer could create a booking, start payment, return from VNPay, and see booking status updated through the event workflow.

## Next Prompt

```text
Integrate the frontend with the API gateway and verify the complete Travel TVB user workflows.
```
