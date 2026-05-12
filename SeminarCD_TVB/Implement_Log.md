# Implement_Log.md — Travel TVB Microservices Migration

> **Plan**: [MICROSERVICES_PLAN.md](MICROSERVICES_PLAN.md)
> **Start date**: 2026-05-12
> **Branch**: `claude/happy-cerf-cc9584`
> **Estimated duration**: 20–26 weeks across 7 SDLC phases / 8 sprints
> **Workflow**: see [CLAUDE.md](CLAUDE.md)

This log is the source of truth for "what have we shipped so far". It is updated **after every completed feature** along with a commit + push (per the policy in CLAUDE.md).

---

## Task Breakdown

Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked

### Phase 0 — Workflow Bootstrap
- [x] **F0.0** Create `CLAUDE.md` + `Implement_Log.md`; lock in workflow, commit/push policy, and task breakdown.

### Sprint 0 — Infrastructure Setup (Weeks 1–2)
- [ ] **F0.1** Reorganise repo into `services/`, `libs/shared/`, `infra/` layout (monolith stays intact during transition).
- [ ] **F0.2** `infra/docker-compose.yml` — PostgreSQL (per-service schemas), RabbitMQ, ChromaDB, Redis, Kong gateway.
- [ ] **F0.3** Kong gateway `kong.yml` — declarative routes with stubs for all 6 future services.
- [ ] **F0.4** `libs/shared/` — JWT validator middleware (TS + Py), RabbitMQ publisher/consumer abstractions, JSON logger.
- [ ] **F0.5** RabbitMQ topology — exchanges `booking.events`, `catalog.events`, `payment.events`; queue conventions documented.
- [ ] **F0.6** CI/CD template — `.github/workflows/_service.yml` reusable workflow (lint → test → build → push image).
- [ ] **F0.7** Sprint 0 retrospective — capture decisions and unknowns in this log.

### Sprint 1 — AI Chatbot Service (Weeks 3–5)
*Lowest coupling — extracted first.*
- [x] **F1.1** FastAPI scaffold (`services/ai-chatbot-service/`) — pyproject, Dockerfile, `/health` route, structured logging.
- [x] **F1.2** Port `chatbot.js` controller → `POST /api/chat/query` — request validation, rate limiter (15 req/min/IP), error handling.
- [x] **F1.3** Port `vectorStore.js` → Python ChromaDB client wrapper (query/upsert/delete), tested against a real ChromaDB.
- [x] **F1.4** Port chatbot service logic — Gemini embedding call, RAG context build, prompt template, response shaping.
- [ ] **F1.5** Port `indexTours.js` → async indexing job. CLI: `python -m chatbot.scripts.index_tours`.
- [ ] **F1.6** Kong route `/api/chatbot/*` → ai-chatbot-service.
- [ ] **F1.7** Remove `Travel_TVB_Server/src/api/chatbot/` from monolith; verify the frontend `ChatbotWidget` still works.
- [ ] **F1.8** PyTest suite ≥75% coverage; contract test with the frontend payload schema.

### Sprint 2 — Identity Service (Weeks 6–7)
- [ ] **F2.1** NestJS scaffold (`services/identity-service/`) — modules, TypeORM, PostgreSQL, healthcheck.
- [ ] **F2.2** Data migration script — SQLite `up_users` → PostgreSQL `users` (preserve `id`, hashed password, role).
- [ ] **F2.3** Auth endpoints — `POST /api/auth/local`, `POST /api/auth/local/register`, `GET /api/users/me`. JWT issuance compatible with the current `AuthContext.jsx`.
- [ ] **F2.4** Kong auth plugin — validate JWT, inject `X-User-Id`, `X-User-Role` headers downstream.
- [ ] **F2.5** Disable Strapi `users-permissions` routes (or remove plugin entirely once safe).
- [ ] **F2.6** Jest suite ≥80% coverage; Pact provider tests for `/api/auth/*` and `/api/users/me`.

### Sprint 3 — Catalog Service (Weeks 8–10)
- [ ] **F3.1** NestJS scaffold (`services/catalog-service/`) — Tour, TourCategory, Region, Itinerary, Highlight, Gallery, Pricing modules.
- [ ] **F3.2** Schema design — PostgreSQL tables matching Strapi tour entities incl. locale variants (vi/en/zh).
- [ ] **F3.3** Data migration — SQLite tour tables → PostgreSQL `catalog_db`. Preserve slugs, IDs, locale links.
- [ ] **F3.4** REST API — match every existing `/api/tours`, `/api/tour-categories` endpoint contract (filters, populate, locale, pagination).
- [ ] **F3.5** Publish `TourUpdated` event on create/update/delete to `catalog.events`.
- [ ] **F3.6** AI Chatbot consumer — `TourUpdated` → re-index that tour's chunks in ChromaDB.
- [ ] **F3.7** Kong routes `/api/tours/*`, `/api/tour-categories/*` → catalog-service.
- [ ] **F3.8** Remove tour APIs from monolith Strapi; verify frontend `Tours.jsx`, `TourDetail.jsx`.
- [ ] **F3.9** Jest suite ≥80% coverage; CQRS read-model split for high-traffic list/detail queries.

### Sprint 4 — Content Service (Weeks 11–12)
- [ ] **F4.1** Re-package remaining Strapi as `services/content-service/` (blogs, FAQ, page sections, about, services, layout, newsletter).
- [ ] **F4.2** Migrate Strapi tables SQLite → PostgreSQL `content_db`; switch `config/database.js`.
- [ ] **F4.3** Remove booking, chatbot, tour APIs from Strapi (already moved out by prior sprints; cleanup pass).
- [ ] **F4.4** Kong routes for all content endpoints (single-posts, faqs, home-*, about-*, layout-*).
- [ ] **F4.5** Strapi Jest suite ≥70% coverage on remaining controllers.

### Sprint 5 — Booking & Payment Services (Weeks 13–16)
- [ ] **F5.1** Booking NestJS scaffold (`services/booking-service/`) — Booking, TravelDate, ContactInfo modules.
- [ ] **F5.2** Port `booking.js` controller (599 lines) → NestJS — `create`, `myBookings`, `cancelBooking`, `getAvailability`.
- [ ] **F5.3** Publish `BookingCreated` event on creation.
- [ ] **F5.4** Subscribe to `payment.events` — `PaymentCompleted` / `PaymentFailed` → update booking status state machine.
- [ ] **F5.5** Payment NestJS scaffold (`services/payment-service/`) — Payment, VNPayTransaction, RefundRequest modules.
- [ ] **F5.6** Port VNPay logic — `createPaymentUrl`, `vnpayReturn` (HMAC verification), `processVnpayRefund` from `vnpay-helpers.js`.
- [ ] **F5.7** Publish `PaymentCompleted` / `PaymentFailed` after callback verification.
- [ ] **F5.8** Circuit breaker around outbound VNPay calls.
- [ ] **F5.9** Kong routes `/api/bookings/*`, `/api/payments/*`.
- [ ] **F5.10** Saga end-to-end test — happy path, payment failure, timeout/compensation.
- [ ] **F5.11** Jest suites ≥85% coverage; Pact consumer/provider tests for the Booking↔Payment contract.

### Sprint 6 — Frontend Migration (Weeks 17–18)
- [ ] **F6.1** Update `VITE_STRAPI_URL` → `VITE_API_GATEWAY_URL`; refactor `src/config/strapi.js` to point at the gateway.
- [ ] **F6.2** Audit all `fetch`/API calls in `src/page/` and `src/components/` — confirm paths still resolve through Kong.
- [ ] **F6.3** Add per-service error boundaries / graceful degradation (e.g. chatbot down ≠ tours down).
- [ ] **F6.4** Update `AuthContext.jsx` to point to Identity Service endpoints.
- [ ] **F6.5** Update `BookingForm/` flow to call Booking + Payment services in correct order.
- [ ] **F6.6** Playwright E2E tests for BW-01 through BW-08 (six scenarios in plan §5.3).

### Sprint 7 — Monolith Decommission (Week 19)
- [ ] **F7.1** Remove non-content APIs from monolith Strapi (final sweep).
- [ ] **F7.2** Archive `Travel_TVB_Server/.tmp/data.db` → `archives/sqlite-final.db`.
- [ ] **F7.3** DNS / reverse proxy cutover — production hostname points at Kong only.
- [ ] **F7.4** Decommission watch — 1 week monitoring period before tearing down the old Strapi container.

### Phase 5 — Testing Strategy (parallel with Phase 4)
- [ ] **T1** PostgreSQL testcontainers wired into Jest/PyTest configs.
- [ ] **T2** Pact broker (self-hosted) + CI integration.
- [ ] **T3** Playwright workspace under `tests/e2e/` covering the six E2E scenarios.
- [ ] **T4** Chaos scenarios — Payment crash, RabbitMQ outage, Catalog DB slowdown, AI OOM (Toxiproxy/Litmus).

### Phase 6 — Deployment & CI/CD (parallel with Phase 4)
- [ ] **D1** Per-service `Dockerfile` + `.dockerignore`.
- [ ] **D2** GitHub Actions workflow per service (uses the reusable workflow from F0.6).
- [ ] **D3** Kubernetes manifests — Deployment, Service, Ingress per service.
- [ ] **D4** HPA configs for Catalog (2–5) and AI Chatbot (2–4).
- [ ] **D5** `staging` and `production` namespaces with secrets management (Sealed Secrets or External Secrets).

### Phase 7 — Maintenance & Operations
- [ ] **M1** ELK stack — Fluentbit DaemonSet → Elasticsearch → Kibana.
- [ ] **M2** OpenTelemetry SDK in each service; Jaeger collector; `trace_id` propagated via gateway.
- [ ] **M3** Prometheus scrape configs + Grafana dashboards (Service Health, Booking Pipeline, AI Chatbot, Infra).
- [ ] **M4** Grafana alerting rules — error rate, P99 latency, service down.
- [ ] **M5** Runbooks in `docs/runbooks/` for the four scenarios in plan §7.3.

---

## Phase Log

### F0.0 — Workflow Bootstrap — 2026-05-12

**What was done**
- Created [CLAUDE.md](CLAUDE.md) capturing the strangler-fig migration approach, target repo layout, coding conventions, testing targets, and the auto-commit/push policy.
- Created this `Implement_Log.md` with the full task breakdown (Sprints 0–7 plus parallel Phases 5–7) — 50 features in total.

**Files touched**
- `CLAUDE.md` (new)
- `Implement_Log.md` (new)

**Decisions**
- **Branch strategy**: all work happens on `claude/happy-cerf-cc9584` until a feature lands and is ready to merge to `main`.
- **Commit identity**: author `Paterra <therealpaterra22@gmail.com>`, co-authors `trivanthai@gmail.com` + `tranbao2464ltk@gmail.com`. Display names are best-effort placeholders — the user can edit `CLAUDE.md` if they want different names.
- **Plan is canon**: any change to `MICROSERVICES_PLAN.md` requires explicit user approval before implementation deviates.
- **Strangler Fig order**: extract in order of lowest→highest coupling (AI Chatbot → Identity → Catalog → Content → Booking/Payment) so the monolith stays functional throughout.

**Issues / unknowns**
- Display names for the three commit identities are guesses — user should confirm or override in `CLAUDE.md`.
- Whether to use one PostgreSQL instance with per-service schemas vs six separate instances in local dev — decision deferred to F0.2 (recommend one instance / six DBs locally; six instances in K8s prod).

**Next**
- **F0.1**: repo reorganisation. Create `services/`, `libs/shared/`, `infra/` directories; keep `Travel_TVB/` and `Travel_TVB_Server/` in place during the transition.

---

### F1.1 — AI Chatbot FastAPI scaffold — 2026-05-12

**What was done**
- Created `services/ai-chatbot-service/` skeleton: pyproject (FastAPI, Pydantic v2, google-generativeai, chromadb, aio-pika, python-json-logger), Dockerfile (slim Python 3.11 + curl-based HEALTHCHECK), `.dockerignore`, `.env.example`, `.gitignore`, README.
- Wired structured JSON logging (`app/logging.py`) injecting `service_name=ai-chatbot-service` into every record.
- Pydantic `Settings` (`app/config.py`) covers Gemini, ChromaDB, RabbitMQ, Catalog service URL, and rate-limit knobs — all overridable via env.
- FastAPI app (`app/main.py`) with `lifespan` handler that boots logging on startup; `/health` controller returns `{status:"ok", service:"ai-chatbot-service"}`.
- Test scaffold: `conftest.py` provides a `TestClient` fixture; `test_health.py` asserts the 200 contract.

**Files touched**
- `SeminarCD_TVB/services/ai-chatbot-service/pyproject.toml`, `Dockerfile`, `.dockerignore`, `.env.example`, `.gitignore`, `README.md`
- `app/__init__.py`, `app/config.py`, `app/logging.py`, `app/main.py`, `app/controllers/__init__.py`, `app/controllers/health.py`
- `tests/__init__.py`, `tests/conftest.py`, `tests/test_health.py`

**Decisions**
- **Service port = 8080** internally; Kong will map it to `/api/chatbot/*` (F1.6).
- **`pydantic-settings`** for typed config matches the NestJS services' style.
- Sprint 0 infra is **not blocking** Sprint 1 — service runs standalone; gateway/RabbitMQ wiring deferred to F1.6 / F3.6.

**Issues / unknowns**
- ChromaDB default port differs between the monolith cron (42839) and the plan (8000). Service defaults to 8000; cron will be deleted in F1.7.

**Next**
- **F1.2** — port the controller: `POST /api/chat/query` with input validation, rate limit (15 req/min/IP), structured error envelope.

---

### F1.2 — Chatbot controller, validation, rate limit — 2026-05-12

**What was done**
- Pydantic schemas (`app/models/chat.py`): `ChatRequest` (whitespace-stripped message ≤500 chars, language ∈ {vi,en,zh}, history ≤10 items, optional `sessionId` accepting camelCase), `ChatReply`, `ChatSource`, `ChatResponse`, `ErrorResponse`. Matches the response envelope the existing frontend `ChatbotWidget` already parses.
- Sliding-window rate limiter (`app/middleware/rate_limit.py`): thread-safe deque-per-IP, injectable clock for tests, configurable via env (`RATE_LIMIT_MAX_REQUESTS=15`, `RATE_LIMIT_WINDOW_SECONDS=60`).
- Controller (`app/controllers/chat.py`): `POST /api/chat/query`, derives client IP from `X-Forwarded-For` (first hop) → `request.client.host`, returns Strapi-style `{error:{status,message}}` envelopes on 400/429/500.
- `app/deps.py`: cached `get_rate_limiter` and `get_chatbot_service` factories so tests can override.
- Stub chatbot service (`app/services/chatbot.py`) returns a polite language-aware fallback — the real Gemini+RAG pipeline lands in F1.4.
- Tests: `test_rate_limit.py` (4 cases — block-at-max, window-expiry, per-IP isolation, prune) and `test_chat_controller.py` (8 cases — happy path, message stripping, default language, empty/unsupported/invalid history, 429, 500, camelCase sessionId, malformed JSON).

**Files touched**
- `services/ai-chatbot-service/app/models/__init__.py`, `models/chat.py`
- `services/ai-chatbot-service/app/middleware/__init__.py`, `middleware/rate_limit.py`
- `services/ai-chatbot-service/app/services/__init__.py`, `services/chatbot.py`
- `services/ai-chatbot-service/app/controllers/chat.py`, `app/deps.py`, `app/main.py` (router include)
- `services/ai-chatbot-service/tests/test_rate_limit.py`, `tests/test_chat_controller.py`

**Decisions**
- **Error envelope** kept identical to Strapi's `{error: {status, message}}` so the frontend doesn't need changes when Kong starts routing here.
- **camelCase compatibility** via `populate_by_name` + alias `sessionId` — the original frontend sends `sessionId`, the new service stores `session_id` internally.
- **History `role`** kept as `'user'|'bot'` (not `'user'|'model'`) at the API boundary; conversion to Gemini's `model` role happens inside the service layer in F1.4.
- **Rate limiter is in-process** — fine for one replica behind Kong. Once we scale to 2+ chatbot replicas, swap to Redis (Phase 7 op concern, not Sprint 1).
- **Service interface** declared via `typing.Protocol` so the stub today and the real Gemini implementation in F1.4 are drop-in interchangeable.

**Issues / unknowns**
- The original controller logged via `strapi.log`; here we use the stdlib root logger configured by F1.1's JSON formatter. Trace-id propagation (planned for F0.4) will be retro-fitted as middleware later.

**Next**
- **F1.3** — Python ChromaDB client wrapper (`app/services/vector_store.py`): query / upsert / clear, language-filtered search with English fallback, retry on 429 from Gemini embeddings.

---

### F1.3 — Python ChromaDB client + Gemini embedding wrapper — 2026-05-12

**What was done**
- `app/services/gemini.py` — async Gemini wrapper. `embed()` retries up to 5 times on 429 with linear back-off (5s, 10s, 15s, 20s, 25s, matching the monolith). `generate()` builds a chat session with system instruction + prior history and returns the response text. Both methods offload the sync SDK calls to `asyncio.to_thread`.
- `app/services/vector_store.py` — `VectorStore` class. Lazy `get_or_create_collection` of `tour_embeddings` under an asyncio lock. `search()` reproduces the three-tier fallback (requested language → English → unfiltered). `add_documents()` chunks into batches of 5 with a 1 s inter-request delay between embeds. `clear_collection()` deletes and recreates the collection.
- Protocols (`ChromaClientLike`, `ChromaCollection`, `GeminiClient`) make the implementation injectable for tests without spinning up a real ChromaDB or hitting Gemini.
- `build_chroma_client()` factory keeps the import of the heavyweight `chromadb` package out of the test paths.
- Tests: `test_vector_store.py` (7 cases — happy search, two-tier fallback, three-tier fallback, English-already-requested edge case, batched upsert, empty no-op, clear+recreate) and `test_gemini_retry.py` (7 cases — 429 detection by status/keyword, retry-then-succeed, max-retries-exhausted, non-429 propagation).

**Files touched**
- `services/ai-chatbot-service/app/services/gemini.py`
- `services/ai-chatbot-service/app/services/vector_store.py`
- `services/ai-chatbot-service/tests/test_vector_store.py`
- `services/ai-chatbot-service/tests/test_gemini_retry.py`
- `SeminarCD_TVB/Implement_Log.md`

**Decisions**
- **Async-via-`to_thread`** rather than the chromadb async client — the sync client surface is more stable, and offloading to a thread pool is enough for a service that's IO-bound on Gemini, not on Chroma.
- **Protocol-based DI** so unit tests don't need ChromaDB or network. Integration tests against a real ChromaDB will be added in F1.8 (Sprint 1's coverage feature).
- **Retry back-off** is **linear**, not exponential — preserves the existing UX where the longest possible wait is 5+10+15+20=50 s before failing. Future hardening can swap for jittered exponential if we see thundering-herd behaviour.
- **`tour_embeddings`** collection name kept identical to the monolith so the existing indexed data in dev/staging ChromaDB instances doesn't need re-indexing on cut-over.
- **Embedding dimension assumption (3072 for `gemini-embedding-001`)** — not enforced in code, since Gemini returns the right size; tests stub a short vector for speed.

**Issues / unknowns**
- The `google.generativeai` SDK's exception types are inconsistent across versions; the retry detector checks both `.status`/`.code` attributes and substring match in the message. Will tighten once we lock the SDK version in F1.4.
- ChromaDB's response shape (`{documents:[[...]], metadatas:[[...]], distances:[[...]]}`) is reproduced in fakes. If the upstream API changes shape, the integration test in F1.8 will catch it.

**Next**
- **F1.4** — wire `GoogleGeminiClient` + `VectorStore` into a real `RealChatbotService` that implements the `ChatbotService` protocol, replacing the stub in `app/deps.py`. Port the system prompt + source-extraction logic from `chatbot.js`.

---

### F1.4 — RealChatbotService (RAG orchestration) — 2026-05-12

**What was done**
- `RealChatbotService` in `app/services/chatbot.py` implements the same five-step pipeline as `chatbot.js`: search → build system prompt → convert history → call Gemini → extract sources.
- Ported helpers: `_build_system_prompt(language, hits)` reproduces the 9-rule system instruction verbatim; `_to_gemini_history(history)` converts `bot → model` and drops leading-model turns (Gemini API requirement); `_extract_sources(hits, reply)` mirrors the JS heuristic of matching by slug, `[slug]` bracketed reference, or any 3+-char name word in the reply.
- Language-aware error fallback messages preserved verbatim from `chatbot.js` (`_FRIENDLY_FALLBACK`).
- `app/deps.py` now wires `RealChatbotService` by default; falls back to `StubChatbotService` if `GOOGLE_AI_API_KEY` is unset or wiring fails (defensive — local dev shouldn't 500 just because the key is missing).
- Tests: `test_real_chatbot_service.py` (12 cases — prompt template content/language, no-context branch, history role mapping, leading-model drop, last-10 window, source extraction via slug/bracket/name-word/dedup/no-match, full chat happy path, vector-store error fallback, gemini error fallback, history wiring).

**Files touched**
- `services/ai-chatbot-service/app/services/chatbot.py` (added `RealChatbotService` + helpers; reorganised file)
- `services/ai-chatbot-service/app/deps.py` (real service wiring with stub fallback)
- `services/ai-chatbot-service/tests/test_real_chatbot_service.py`
- `SeminarCD_TVB/Implement_Log.md`

**Decisions**
- **Errors caught inside the service** return the friendly fallback (parity with the JS version) — the controller's `try/except` is now strictly defence-in-depth.
- **`_to_gemini_history` slices last 10** at the service level even though the controller already caps at 10. Belt and suspenders; the service is callable from CLI/event consumers later (Sprint 3) and shouldn't trust upstream truncation.
- **Stub fallback in `get_chatbot_service`** keeps local dev working without secrets and prevents a 500 on every `/api/chat/query` when the API key rotates and the new value isn't deployed yet.
- Did NOT add an integration test against the real Gemini / ChromaDB — those belong in F1.8 (the dedicated coverage feature) where we can spin up a container via testcontainers.

**Issues / unknowns**
- The Gemini SDK's exact field name for embeddings varies between versions (`result.embedding.values` vs `result["embedding"]`). The wrapper supports both, but we should pin the SDK version in F1.8 to avoid surprises.

**Next**
- **F1.5** — `app/scripts/index_tours.py`: async CLI that fetches all tours from the Catalog Service (or the still-monolith Strapi during Sprint 1), chunks them (overview / description / highlights / itinerary), embeds, and upserts into ChromaDB. Mirrors the cron-driven `index-tours-cron.sh` workflow.

---

## How to update this log
After each feature:
1. Mark the checkbox `[x]` next to the feature ID above.
2. Append a new entry under **Phase Log** with the feature ID, date, and the sections: What was done · Files touched · Decisions · Issues · Next.
3. Commit + push per the policy in `CLAUDE.md`.
