# Phase 4 - Task 05: AI Chatbot Service Build

## User Prompt

```text
Build the AI Chatbot Service for Travel TVB.
It must use FastAPI, validate chat requests, rate limit requests, search tour knowledge with ChromaDB, use Gemini for embeddings and answer generation, index tours, consume catalog events, and include tests.
```

## AI Understanding

AI understood the chatbot as an AI-guided travel assistant. It needed to answer from Travel TVB tour data, avoid generic unsupported responses, expose a stable API for the frontend, and keep the vector index current.

## AI Work Report

AI built the AI Chatbot Service:

- Created a FastAPI service scaffold.
- Added `/health` and `POST /api/chat/query`.
- Added Pydantic request and response validation.
- Added per-IP rate limiting for chat requests.
- Implemented structured JSON logging.
- Implemented ChromaDB client wrapper for query, upsert, and delete operations.
- Implemented Gemini embedding wrapper.
- Implemented RAG context building and prompt shaping.
- Implemented answer response formatting with tour source metadata.
- Implemented async tour indexing CLI.
- Implemented catalog event consumer for tour created, updated, and deleted events.
- Added gateway route mapping for chatbot traffic.

AI added tests:

- Unit tests for validation and service behavior.
- Vector store tests with fakes.
- Chat contract tests for frontend payload shape.
- Event consumer tests.
- Coverage gate aligned with the AI Chatbot target.

## Deliverables

- AI Chatbot Service source code.
- FastAPI route and DTOs.
- Gemini and ChromaDB integration wrappers.
- Tour indexing CLI.
- Catalog event consumer.
- PyTest suite.

## Validation Notes

The task was complete when the frontend could send chat messages, receive source-aware replies, and the vector index could be refreshed from tour data.

## Next Prompt

```text
Build the Booking and Payment Services with booking lifecycle, VNPay integration, saga events, circuit breaker, and tests.
```
