# API Gateway (Kong)

Single entrypoint for the Travel TVB microservices. Declarative DB-less Kong config.

- **Proxy**: `http://localhost:8000`
- **Admin** (dev only): `http://localhost:8001`
- **Config**: [kong.yml](kong.yml) — versioned, applied at container start

## Local stacks

Full shared infrastructure stack:

```bash
docker compose -f infra/docker-compose.yml up
```

Gateway + chatbot-only stack:

```bash
docker compose -f services/api-gateway/docker-compose.yml up
```

Brings up Kong + the AI chatbot service + ChromaDB. The frontend's `VITE_STRAPI_URL` should point at `http://localhost:8000` once Sprint 6 lands; until then the chatbot route is the first one to flip.

## Routes currently configured

| Public path | Methods | Upstream | Auth | Notes |
|---|---|---|---|---|
| `/api/chatbot/query` | POST | ai-chatbot-service `/api/chat/query` | — | path rewrite |
| `/api/chatbot/health` | GET | ai-chatbot-service `/health` | — | smoke check |
| `/api/auth/local` | POST | identity-service | — | login |
| `/api/auth/local/register` | POST | identity-service | — | register |
| `/api/users/me` | GET | identity-service | JWT | gateway validates JWT, injects `X-User-Id` + `X-User-Role` |
| `/api/tours`, `/api/tours/:id`, `/api/tours/slug/:slug` | GET | catalog-service | — | public reads |
| `/api/tours`, `/api/tours/:id` | POST/PUT/PATCH/DELETE | catalog-service | JWT | gateway validates JWT + injects user headers; service enforces admin role |
| `/api/tour-categories`, `/api/tour-categories/:id` | GET | catalog-service | — | public reads |
| `/api/single-posts`, `/api/faq`, `/api/home-*`, `/api/about-*`, etc. | GET, POST | content-service | — | public content reads + newsletter submissions |
| `/api/bookings/availability` | GET | booking-service | — | public availability lookup |
| `/api/bookings` | GET/POST/PUT/PATCH/DELETE | booking-service | JWT | gateway validates JWT + injects user headers |
| `/api/payments/vnpay-return` | GET | payment-service | — | public VNPay callback |
| `/api/payments` | GET/POST/PUT/PATCH/DELETE | payment-service | JWT | gateway validates JWT + injects user headers |

### JWT trust model

- Identity Service signs JWTs with `HS256` and the secret in `JWT_SECRET`. Claims: `sub` (user id), `username`, `role`, `iss="identity-service"`, `exp`.
- Kong validates the signature with the consumer `travel-tvb-frontend` whose `jwt_secrets[].key = identity-service` matches the `iss` claim.
- After validation, Kong's `post-function` decodes the token and sets `X-User-Id` / `X-User-Role` on the upstream request. Downstream services trust those headers and never re-parse the JWT.
- Kong's `JWT_SHARED_SECRET` in `kong.yml` MUST match the Identity Service's `JWT_SECRET`. Both should be templated at deploy time (e.g. `envsubst < kong.yml.tpl > kong.yml` in a Helm pre-install hook).

## Validate config

```bash
docker run --rm -v $(pwd)/kong.yml:/etc/kong/kong.yml:ro kong:3.7.1 \
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
