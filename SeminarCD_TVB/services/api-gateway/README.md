# API Gateway (Kong)

Single entrypoint for the Travel TVB microservices. Declarative DB-less Kong config.

- **Proxy**: `http://localhost:8000`
- **Admin** (dev only): `http://localhost:8001`
- **Config**: [kong.yml](kong.yml) — versioned, applied at container start

## Local stack

```bash
docker compose -f services/api-gateway/docker-compose.yml up
```

Brings up Kong + the AI chatbot service + ChromaDB. The frontend's `VITE_STRAPI_URL` should point at `http://localhost:8000` once Sprint 6 lands; until then the chatbot route is the first one to flip.

## Routes currently configured

| Public path | Methods | Upstream | Notes |
|---|---|---|---|
| `/api/chatbot/query` | POST | ai-chatbot-service `/api/chat/query` | path rewrite preserves the frontend URL |
| `/api/chatbot/health` | GET | ai-chatbot-service `/health` | smoke check via the gateway |

Sprint 2 will add `/api/auth/*` and `/api/users/me` → identity-service. Sprint 3 adds `/api/tours/*` and `/api/tour-categories/*` → catalog-service.

## Validate config

```bash
docker run --rm -v $(pwd)/kong.yml:/etc/kong/kong.yml:ro kong:3.7-alpine \
  kong config parse /etc/kong/kong.yml
```

## Reload after editing

```bash
docker compose -f services/api-gateway/docker-compose.yml restart kong
```

Or, against the admin API:

```bash
curl -X POST http://localhost:8001/config -F config=@kong.yml
```
