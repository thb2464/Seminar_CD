# Phase 3 - Task 01: High-Level System Architecture

## User Prompt

```text
Design the high-level architecture for Travel TVB.
Include the frontend, API gateway, six services, databases, event broker, cache, and vector database.
```

## AI Understanding

AI understood that the architecture needed a single public entry point and independently deployable backend services. The design had to support transactional flows, public content reads, AI search, and payment callbacks.

## AI Work Report

AI designed the architecture:

- React and Vite frontend as the browser application.
- Kong API Gateway as the public API entry point.
- Identity Service using NestJS and PostgreSQL.
- Catalog Service using NestJS and PostgreSQL.
- Booking Service using NestJS and PostgreSQL.
- Payment Service using NestJS and PostgreSQL.
- Content Service using Strapi 5 and PostgreSQL.
- AI Chatbot Service using FastAPI and ChromaDB.
- RabbitMQ for domain events.
- Redis for cache and future shared rate-limit state.
- Shared libraries for structured logs, trace IDs, and messaging helpers.

AI described request flow:

- Browser sends all API requests to the gateway.
- Gateway routes `/api/auth/*` to Identity.
- Gateway routes `/api/tours/*` and `/api/tour-categories/*` to Catalog.
- Gateway routes `/api/bookings/*` to Booking.
- Gateway routes `/api/payments/*` to Payment.
- Gateway routes content endpoints to Content.
- Gateway routes `/api/chatbot/*` to AI Chatbot.

## Deliverables

- Architecture overview.
- Service-to-route mapping.
- Infrastructure dependency list.
- Request-flow explanation.

## Validation Notes

The task was complete when each public API path had an owning service and every system dependency had a clear purpose.

## Next Prompt

```text
Design the service communication, database, security, and event patterns for the Travel TVB architecture.
```
