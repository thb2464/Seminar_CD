# Catalog Service

Owns the tour catalog: `Tour`, `TourCategory`, `Region`, plus the embedded `Itinerary`/`Highlights`/`Gallery`/`Pricing` structures. Replaces the Strapi `api/tour` and `api/tour-category` modules.

- **Stack**: NestJS 10 · TypeORM · PostgreSQL · amqplib (RabbitMQ publisher for `catalog.events`)
- **Port**: 3001 internally; routed via Kong at `/api/tours/*` and `/api/tour-categories/*`
- **Health**: `GET /health`

## Endpoints (target contract — implemented across F3.2–F3.4)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/tours` | none | locale, populate, filters, pagination — Strapi-compatible |
| GET | `/api/tours/:id` | none | single tour |
| GET | `/api/tour-categories` | none | list categories |
| GET | `/api/tour-categories/:id` | none | single category |
| POST | `/api/tours` | admin (JWT) | create — emits `TourCreated` |
| PUT | `/api/tours/:id` | admin (JWT) | update — emits `TourUpdated` |
| DELETE | `/api/tours/:id` | admin (JWT) | soft-delete — emits `TourDeleted` |

## Local development

```bash
cd services/catalog-service
npm install
cp .env.example .env
# Spin up Postgres + RabbitMQ first (see infra/docker-compose.yml)
npm run migration:run
npm run start:dev
```

## Tests

```bash
npm test                 # unit
npm run test:cov         # >=80% gate
npm run test:e2e         # full request lifecycle
```

## Events published

- `catalog.events / TourCreated`
- `catalog.events / TourUpdated`
- `catalog.events / TourDeleted`

Consumed by the AI Chatbot Service (re-indexes ChromaDB) and any other service that needs to keep a local read-model in sync.
