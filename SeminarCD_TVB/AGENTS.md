# AGENTS.md — Travel TVB Microservices Refactor

This file tells future Codex sessions how to work in this repo. Read it first.

---

## Project Context

We're building a **microservices** Travel TVB tour-guide & booking platform .

- **Master plan**: [MICROSERVICES_PLAN.md](MICROSERVICES_PLAN.md) — 7-phase SDLC, ~20–26 weeks. **Do not change the plan without explicit user approval.**
- **Progress log**: [Implement_Log.md](Implement_Log.md) — task breakdown + per-feature notes. **Update it after every feature.**
- **Migration strategy**: Strangler Fig — extract services incrementally, keep the monolith running. Order is lowest→highest coupling: AI Chatbot → Identity → Catalog → Content → Booking/Payment.

---

## Repository Layout

### Current (monolith — leave intact during transition)
- `Travel_TVB/` — React 19 + Vite 7 frontend. 16 pages under `src/page/`, ~30 components under `src/components/`. Auth via `src/context/AuthContext.jsx`, i18n via `src/context/LanguageContext.jsx`, API config in `src/config/strapi.js`.
- `Travel_TVB_Server/` — Strapi 5.36 backend. 27 content types under `src/api/`. SQLite DB at `.tmp/data.db`. Hot spots: `api/booking/` (599-line controller + VNPay), `api/chatbot/` (RAG pipeline), `api/tour/`.

### Target (to be created during Sprint 0 — see Implement_Log F0.1)
```
services/
  identity-service/      NestJS + PostgreSQL  — auth, users, JWT
  catalog-service/       NestJS + PostgreSQL  — tours, categories, regions
  booking-service/       NestJS + PostgreSQL  — bookings, refunds
  payment-service/       NestJS + PostgreSQL  — VNPay integration
  content-service/       Strapi 5 + PostgreSQL — blogs, FAQ, page sections
  ai-chatbot-service/    FastAPI + ChromaDB   — RAG chatbot
  api-gateway/           Kong declarative config
libs/shared/             JWT validator, event bus, JSON logger (TS + Py)
infra/
  docker-compose.yml     Local dev stack
  k8s/                   Manifests, HPAs, Ingress
tests/e2e/               Playwright suite
```

The monolith stays in place until each replacement service is verified, then the relevant code is removed in its sprint's cleanup step.

---

## How to Work

1. **Pick the next feature** from `Implement_Log.md`. Mark it `[~]` in progress.
2. **Work feature-by-feature** — no batching multiple features into one change.
3. **Strangler Fig**: don't break BW-01–BW-08 user workflows. Each new service must be a drop-in replacement behind the gateway.
4. **Database-per-service**: never share a DB between services. Cross-service reads go through REST; cross-service writes go through RabbitMQ events (Saga choreography).
5. **Tests before "done"**: a feature isn't complete until tests pass at the per-service coverage targets (see below). If tests don't exist yet (early sprints), they're part of the feature.
6. **Update `Implement_Log.md`** with: What was done · Files touched · Decisions · Issues · Next. Mark the checkbox `[x]`.
7. **Commit + push** per the policy below.

---

## Commit & Push Policy (auto-commit on feature completion)

**Standing user authorisation**: when a feature in `Implement_Log.md` is finished and its log entry is written, commit and push immediately — no need to ask. This is the only "risky" action pre-authorised; everything else still follows the default confirm-before-risky-action rule.

**Identity to use** (override the local git config for this project):
- **Author**: `Paterra <therealpaterra22@gmail.com>`
- **Co-authored-by**: `Tri Van Thai <trivanthai@gmail.com>`
- **Co-authored-by**: `Tran Bao <tranbao2464ltk@gmail.com>`

> The display names above are best-effort guesses from the email handles. Edit this section if you want different names — Codex will pick them up from here on the next commit.

**Exact procedure** — use the **Bash tool with a heredoc** so the two `Co-authored-by` trailers stay in a single contiguous block (GitHub won't credit the second one otherwise). Multiple `-m` flags insert a blank line between them and break the trailer parser.

```bash
# 1. Stage ONLY files relevant to the feature. Avoid `git add -A` / `git add .`.
git add <path/to/changed/file> [<more files>]

# 2. Commit with the override identity, body, and co-author trailers in one message.
git -c user.name="Paterra" -c user.email="therealpaterra22@gmail.com" \
    commit --author="Paterra <therealpaterra22@gmail.com>" \
    -m "$(cat <<'EOF'
<feat|fix|chore|docs|test>(<feature-id>): <one-line summary, ≤70 chars>

<optional context paragraph explaining the WHY>

Co-authored-by: Tri Van Thai <trivanthai@gmail.com>
Co-authored-by: Tran Bao <tranbao2464ltk@gmail.com>
EOF
)"

# 3. Push the current branch to origin (creates the remote branch on first push).
git push -u origin HEAD
```

**Commit message rules**
- Subject ≤ 70 chars, imperative mood, conventional-commit-style prefix (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `infra`).
- Scope = feature ID from `Implement_Log.md` when applicable, e.g. `feat(F1.2): port chatbot controller to FastAPI`.
- Body explains the *why* if non-obvious.
- Always include both `Co-authored-by:` trailers via separate `-m` flags (so the blank line between body and trailers is preserved).

**Hard rules — never override without explicit user approval**
- Never `--no-verify` or `--no-gpg-sign`. If a hook fails, fix the underlying issue and create a NEW commit.
- Never `--amend` a pushed commit.
- Never force-push (`--force`, `--force-with-lease`) without explicit instruction.
- Never push to `main` directly. We work on `Codex/happy-cerf-cc9584` (or future feature branches) and merge via PR.
- Never `git add -A` / `git add .` — stage explicitly to avoid leaking `.env`, build artefacts, or sibling experiments.

---

## Coding Conventions

- **TypeScript** for all new NestJS services (`tsconfig`: `"strict": true`, `"noUncheckedIndexedAccess": true`).
- **Python 3.11+** for the AI Chatbot service. Type-hint every function signature. `ruff` + `mypy` clean.
- **No premature abstraction** — three repeated lines is fine; extract on the fourth.
- **No backwards-compat shims** until they are actually needed (the monolith APIs we're replacing don't count — they're going away).
- **Logging**: structured JSON, always include `service_name` and `trace_id` fields.
- **Validation**: at API boundaries only — `class-validator` DTOs on NestJS, Pydantic models on FastAPI.
- **Tests live next to code**: `*.spec.ts` (Jest), `test_*.py` (PyTest). Integration tests under `__tests__/integration/` or `tests/integration/`.
- **No comments explaining WHAT** — only WHY when the why is non-obvious. Identifier names should do the rest.

### Per-service coverage targets (from plan §5.2)

| Service | Coverage |
|---|---|
| Identity, Catalog | ≥ 80% |
| Booking, Payment | ≥ 85% |
| Content (Strapi) | ≥ 70% |
| AI Chatbot | ≥ 75% |

Run the test suite before marking a feature `[x]`. If coverage drops below target on a service you touched, raise it back before commit.

---

## Inter-Service Patterns

- **Sync**: REST/JSON (or gRPC where chatty). Gateway → Service. Service → Service for read-only lookups.
- **Async**: RabbitMQ exchanges. Topology:
  - `booking.events` — `BookingCreated`, `BookingCancelled`
  - `payment.events` — `PaymentCompleted`, `PaymentFailed`, `RefundProcessed`
  - `catalog.events` — `TourCreated`, `TourUpdated`, `TourDeleted`
- **Auth propagation**: Kong validates JWT (via Identity Service JWKS or shared secret) and injects `X-User-Id`, `X-User-Role`, `X-Trace-Id` headers. Downstream services trust these headers — never re-validate the raw JWT inside a service.
- **Saga**: Booking↔Payment uses choreography (not orchestration). Compensation events on failure.

---

## Common Commands

### Monolith (still primary during early sprints)
- Frontend: `cd Travel_TVB && npm run dev` (http://localhost:5173)
- Backend: `cd Travel_TVB_Server && npm run develop` (http://localhost:1337)
- ChromaDB: `chroma run --host 0.0.0.0 --port 8000`
- Index tours: `node Travel_TVB_Server/src/api/chatbot/scripts/indexTours.js`
- Frontend tests: `cd Travel_TVB && npm test`
- Backend tests: `cd Travel_TVB_Server && npm test`

### Microservices stack (once Sprint 0 ships)
- Full stack: `docker compose -f infra/docker-compose.yml up`
- Per service: `docker compose -f infra/docker-compose.yml up <service>`
- Reset DBs: `docker compose -f infra/docker-compose.yml down -v && docker compose up`

---

## Out of Scope (don't do unless explicitly asked)

- Rewriting working frontend pages without a microservices-driven reason.
- Touching VNPay credentials — sandbox only; never commit secrets.
- Removing monolith Strapi code before its replacement service is in production behind the gateway.
- Changing the plan in `MICROSERVICES_PLAN.md`.
- Renaming feature IDs in `Implement_Log.md` (they're referenced from commit messages).

---

## Quick Reference

- Current state: monolithic React + Strapi 5 + SQLite + ChromaDB. Sprint 0 not started.
- Target state: 6 services + API gateway + RabbitMQ + PostgreSQL-per-service + ChromaDB + Redis.
- Branch: `Codex/happy-cerf-cc9584`.
- Next feature: **F0.1** — repo reorganisation (`services/`, `libs/shared/`, `infra/`).