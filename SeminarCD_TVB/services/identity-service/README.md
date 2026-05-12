# Identity Service

Replaces the Strapi `users-permissions` plugin. Owns users, roles, JWT issuance and verification.

- **Stack**: NestJS 10 · TypeORM · PostgreSQL · Passport-JWT · bcrypt
- **Port**: 3000 internally; routed via Kong at `/api/auth/*` and `/api/users/me`
- **Health**: `GET /health`

## Endpoints (target contract — implemented in F2.3)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/auth/local` | none | `{ identifier, password }` | `{ jwt, user }` |
| POST | `/api/auth/local/register` | none | `{ username, email, password, full_name, phone }` | `{ jwt, user }` |
| GET | `/api/users/me` | Bearer | — | `User` |

Response/error envelope matches the Strapi format the frontend already parses (`{ error: { message } }` on failure) so `AuthContext.jsx` keeps working unchanged through the migration.

## Local development

```bash
cd services/identity-service
npm install
cp .env.example .env
# spin up PostgreSQL: docker compose up postgres-identity
npm run migration:run
npm run start:dev
```

## Tests

```bash
npm test                 # unit + integration
npm run test:cov         # with coverage gate (>=80% lines/statements)
npm run test:e2e         # e2e against running service
```

## Docker

```bash
docker build -t travel-tvb/identity-service .
docker run --rm -p 3000:3000 --env-file .env travel-tvb/identity-service
```
