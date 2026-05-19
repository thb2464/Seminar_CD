# Phase 2 - Task 01: Domain Decomposition And Service Boundaries

## User Prompt

```text
Analyze the Travel TVB business domains.
Split the system into service boundaries and explain which business capability each service owns.
```

## AI Understanding

AI treated Travel TVB as a distributed business system with several independent capabilities. Each capability needed clear ownership so teams could build, test, deploy, and operate it independently.

## AI Work Report

AI decomposed the platform into six services:

- Identity Service: owns users, roles, login, registration, JWT issuance, and profile lookup.
- Catalog Service: owns tours, categories, regions, itineraries, highlights, gallery metadata, prices, and availability read models.
- Booking Service: owns bookings, contacts, booking status, travel date selection, cancellation, and booking state transitions.
- Payment Service: owns VNPay payment URL creation, payment callbacks, HMAC verification, transaction records, and refund requests.
- Content Service: owns blogs, FAQs, homepage sections, about pages, service pages, layout content, and newsletters.
- AI Chatbot Service: owns chat requests, RAG prompts, tour chunks, vector search, embeddings, and chatbot answers.

AI also identified cross-cutting concerns:

- API Gateway for routing and security enforcement.
- RabbitMQ for asynchronous domain events.
- Shared libraries for logging, event publishing, JWT header handling, and trace propagation.
- PostgreSQL per service for transactional isolation.
- ChromaDB for AI vector search.

## Deliverables

- Service boundary map.
- Service responsibility list.
- Cross-cutting concern list.
- Initial dependency map.

## Validation Notes

The task was complete when every major business capability had exactly one owner service and no service needed to directly own another service's database.

## Next Prompt

```text
Define the data ownership matrix and API dependency graph for the Travel TVB services.
```
