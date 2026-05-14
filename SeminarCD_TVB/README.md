# Travel TVB Microservices Setup Guide

Travel TVB is a tour-guide and booking platform that has been refactored from a
React + Strapi monolith into a microservices stack behind Kong.

This README is focused on getting the project running locally.

## Architecture

```text
Browser
  |
  v
React frontend, Vite, localhost:5173
  |
  v
Kong API Gateway, localhost:8000
  |
  +-- identity-service, NestJS, port 3000
  +-- catalog-service, NestJS, port 3001
  +-- booking-service, NestJS, port 3002
  +-- payment-service, NestJS, port 3003
  +-- content-service, Strapi 5, port 1337
  +-- ai-chatbot-service, FastAPI, port 8080

Shared dependencies:
  PostgreSQL localhost:5432
  RabbitMQ localhost:5672, management UI localhost:15672
  ChromaDB localhost:8800, container port 8000
  Redis localhost:6379
  Pact Broker localhost:9292
```

## Prerequisites

Install these before starting:

| Tool | Version |
| --- | --- |
| Node.js | 20.x through 24.x |
| npm | bundled with Node.js |
| Python | 3.11 or newer |
| Docker Desktop | current stable |
| Git | current stable |

Check the basics:

```powershell
node --version
npm --version
python --version
docker --version
docker compose version
```

The commands below use PowerShell. On macOS, Linux, or Git Bash, replace the
PowerShell line-continuation backtick with `\` and use `export NAME=value`
instead of `$env:NAME = "value"`.

## 1. Clone the repository

```powershell
git clone <repository-url>
cd SeminarCD_TVB
```

## 2. Start shared infrastructure

Start PostgreSQL, RabbitMQ, ChromaDB, Redis, Pact Broker, and Kong:

```powershell
docker compose -f infra/docker-compose.yml up -d postgres rabbitmq chromadb redis pact-broker kong
```

Useful local URLs:

| Component | URL |
| --- | --- |
| Kong gateway | http://localhost:8000 |
| Kong admin API | http://localhost:8001 |
| RabbitMQ management | http://localhost:15672 |
| Pact Broker | http://localhost:9292 |
| ChromaDB | http://localhost:8800 |

Local credentials from `infra/docker-compose.yml`:

| Service | Username | Password |
| --- | --- | --- |
| PostgreSQL admin | `travel_tvb_admin` | `travel_tvb_admin` |
| RabbitMQ | `guest` | `guest` |
| Pact Broker write | `pact_ci` | `pact_ci` |
| Pact Broker read-only | `pact_read` | `pact_read` |

The Postgres init script creates these service databases:

| Database | Owner | Password |
| --- | --- | --- |
| `identity_db` | `identity` | `identity` |
| `catalog_db` | `catalog` | `catalog` |
| `booking_db` | `booking` | `booking` |
| `payment_db` | `payment` | `payment` |
| `content_db` | `strapi` | `strapi` |

## 3. Install dependencies

Install frontend and service dependencies:

```powershell
npm --prefix Travel_TVB install
npm --prefix services/identity-service install
npm --prefix services/catalog-service install
npm --prefix services/booking-service install
npm --prefix services/payment-service install
npm --prefix services/content-service install
npm --prefix libs/shared/ts install
npm --prefix tests/e2e install
```

Install the Python chatbot service:

```powershell
cd services/ai-chatbot-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
deactivate
cd ..\..
```

## 4. Create local environment files

Do not commit real secrets. Use the values below only for local development.

### Frontend

Create `Travel_TVB/.env.local`:

```env
VITE_API_GATEWAY_URL=http://localhost:8000
VITE_CHATBOT_ENABLED=true
```

`VITE_API_GATEWAY_URL` is the current primary API base. `VITE_STRAPI_URL` is
only a migration fallback.

### Identity service

```powershell
cp services/identity-service/.env.example services/identity-service/.env
```

Edit `services/identity-service/.env`:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=identity
DATABASE_PASSWORD=identity
DATABASE_NAME=identity_db
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=false

JWT_SECRET=change-me-in-prod
JWT_EXPIRES_IN=30d

SQLITE_MIGRATION_SOURCE=../../archives/sqlite-final.db
```

`JWT_SECRET` must match the local Kong JWT secret in
`services/api-gateway/kong.yml`. The checked-in development value there is
`change-me-in-prod`.

### Catalog service

```powershell
cp services/catalog-service/.env.example services/catalog-service/.env
```

Edit `services/catalog-service/.env`:

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=catalog
DATABASE_PASSWORD=catalog
DATABASE_NAME=catalog_db
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=false

RABBITMQ_URL=amqp://guest:guest@localhost:5672/
CATALOG_EVENTS_EXCHANGE=catalog.events

SQLITE_MIGRATION_SOURCE=../../archives/sqlite-final.db
```

### Booking service

Create `services/booking-service/.env`:

```env
NODE_ENV=development
PORT=3002
LOG_LEVEL=info

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=booking
DATABASE_PASSWORD=booking
DATABASE_NAME=booking_db
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=true

RABBITMQ_URL=amqp://guest:guest@localhost:5672/
BOOKING_EVENTS_EXCHANGE=booking.events
PAYMENT_EVENTS_EXCHANGE=payment.events
CATALOG_SERVICE_URL=http://localhost:3001
```

`DATABASE_SYNCHRONIZE=true` is for local first boot only. Use migrations for
shared environments.

### Payment service

Create `services/payment-service/.env`:

```env
NODE_ENV=development
PORT=3003
LOG_LEVEL=info

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=payment
DATABASE_PASSWORD=payment
DATABASE_NAME=payment_db
DATABASE_SSL=false
DATABASE_SYNCHRONIZE=true

RABBITMQ_URL=amqp://guest:guest@localhost:5672/
PAYMENT_EVENTS_EXCHANGE=payment.events
BOOKING_EVENTS_EXCHANGE=booking.events

VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=http://localhost:8000/api/payments/vnpay-return
```

VNPay sandbox credentials are optional for booting the service but required for
real payment URL generation and refund testing.

### Content service

```powershell
cp services/content-service/.env.example services/content-service/.env
```

Edit `services/content-service/.env`:

```env
HOST=0.0.0.0
PORT=1337

APP_KEYS=local-key-1,local-key-2,local-key-3,local-key-4
API_TOKEN_SALT=local-api-token-salt
ADMIN_JWT_SECRET=local-admin-jwt-secret
TRANSFER_TOKEN_SALT=local-transfer-token-salt
ENCRYPTION_KEY=local-encryption-key
JWT_SECRET=local-content-jwt-secret

DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=content_db
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
DATABASE_SSL=false
```

For real environments, replace all Strapi secrets with strong random values.

### AI chatbot service

```powershell
cp services/ai-chatbot-service/.env.example services/ai-chatbot-service/.env
```

Edit `services/ai-chatbot-service/.env` for host-based local development:

```env
APP_HOST=0.0.0.0
APP_PORT=8080
LOG_LEVEL=INFO
ENVIRONMENT=development

GOOGLE_AI_API_KEY=
GEMINI_LLM_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

CHROMADB_HOST=localhost
CHROMADB_PORT=8800
CHROMADB_SSL=false
CHROMA_COLLECTION=tour_embeddings

CATALOG_BASE_URL=http://localhost:3001
CATALOG_API_TOKEN=

RABBITMQ_URL=amqp://guest:guest@localhost:5672/
CATALOG_EVENTS_EXCHANGE=catalog.events

RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=15
```

The compose stack exposes ChromaDB on host port `8800` because Kong already uses
host port `8000`.

## 5. Prepare database schemas

Run TypeORM migrations for the services that already have migration files:

```powershell
cd services/identity-service
npm run migration:run
cd ..\..

cd services/catalog-service
npm run migration:run
cd ..\..
```

Booking and Payment use `DATABASE_SYNCHRONIZE=true` in the local `.env` above so
their tables are created when the services boot.

Strapi creates the Content Service tables on first boot. Start it once and stop
it after the admin server is ready:

```powershell
cd services/content-service
npm run develop
```

Press `Ctrl+C` after Strapi starts successfully, then return to the repo root.

## 6. Optional: import archived monolith data

The final Strapi SQLite snapshot is stored at `archives/sqlite-final.db`.

Import users:

```powershell
cd services/identity-service
$env:SQLITE_MIGRATION_SOURCE = "../../archives/sqlite-final.db"
npx ts-node src/database/migrate-from-sqlite.ts
cd ..\..
```

Import tours and categories:

```powershell
cd services/catalog-service
$env:SQLITE_MIGRATION_SOURCE = "../../archives/sqlite-final.db"
npx ts-node src/database/migrate-from-sqlite.ts
cd ..\..
```

Import content tables:

```powershell
cd services/content-service
$env:SQLITE_SOURCE = "../../archives/sqlite-final.db"
npm run migrate:sqlite
cd ..\..
```

After catalog data exists and the chatbot has a valid `GOOGLE_AI_API_KEY`, index
tours into ChromaDB:

```powershell
cd services/ai-chatbot-service
.\.venv\Scripts\Activate.ps1
python -m app.scripts.index_tours
deactivate
cd ..\..
```

## 7. Run the app services

There are two local run modes.

### Mode A: run services from source

Use this mode when developing service code. Open one terminal per service:

```powershell
cd services/identity-service
npm run start:dev
```

```powershell
cd services/catalog-service
npm run start:dev
```

```powershell
cd services/booking-service
npm run start:dev
```

```powershell
cd services/payment-service
npm run start:dev
```

```powershell
cd services/content-service
npm run develop
```

```powershell
cd services/ai-chatbot-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Direct service URLs in source mode:

| Service | URL |
| --- | --- |
| Identity | http://localhost:3000 |
| Catalog | http://localhost:3001 |
| Booking | http://localhost:3002 |
| Payment | http://localhost:3003 |
| Content | http://localhost:1337 |
| AI chatbot | http://localhost:8080 |

Kong's checked-in config points at Docker service names such as
`identity-service` and `catalog-service`. For full browser testing through Kong,
use Mode B below.

### Mode B: run service containers behind Kong

Use this mode when you want the frontend to call the whole stack through
`http://localhost:8000`.

Build the six app images:

```powershell
docker build -t travel-tvb/identity-service services/identity-service
docker build -t travel-tvb/catalog-service services/catalog-service
docker build -t travel-tvb/booking-service services/booking-service
docker build -t travel-tvb/payment-service services/payment-service
docker build -t travel-tvb/content-service services/content-service
docker build -t travel-tvb/ai-chatbot-service services/ai-chatbot-service
```

Start the service containers on the same Docker network as Kong:

```powershell
docker run -d --name identity-service --network travel-tvb-local -p 3000:3000 `
  -e NODE_ENV=production `
  -e PORT=3000 `
  -e DATABASE_HOST=postgres `
  -e DATABASE_PORT=5432 `
  -e DATABASE_USER=identity `
  -e DATABASE_PASSWORD=identity `
  -e DATABASE_NAME=identity_db `
  -e DATABASE_SSL=false `
  -e DATABASE_SYNCHRONIZE=false `
  -e JWT_SECRET=change-me-in-prod `
  -e JWT_EXPIRES_IN=30d `
  travel-tvb/identity-service
```

```powershell
docker run -d --name catalog-service --network travel-tvb-local -p 3001:3001 `
  -e NODE_ENV=production `
  -e PORT=3001 `
  -e DATABASE_HOST=postgres `
  -e DATABASE_PORT=5432 `
  -e DATABASE_USER=catalog `
  -e DATABASE_PASSWORD=catalog `
  -e DATABASE_NAME=catalog_db `
  -e DATABASE_SSL=false `
  -e DATABASE_SYNCHRONIZE=false `
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/ `
  -e CATALOG_EVENTS_EXCHANGE=catalog.events `
  travel-tvb/catalog-service
```

```powershell
docker run -d --name booking-service --network travel-tvb-local -p 3002:3002 `
  -e NODE_ENV=production `
  -e PORT=3002 `
  -e DATABASE_HOST=postgres `
  -e DATABASE_PORT=5432 `
  -e DATABASE_USER=booking `
  -e DATABASE_PASSWORD=booking `
  -e DATABASE_NAME=booking_db `
  -e DATABASE_SSL=false `
  -e DATABASE_SYNCHRONIZE=true `
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/ `
  -e BOOKING_EVENTS_EXCHANGE=booking.events `
  -e PAYMENT_EVENTS_EXCHANGE=payment.events `
  -e CATALOG_SERVICE_URL=http://catalog-service:3001 `
  travel-tvb/booking-service
```

```powershell
docker run -d --name payment-service --network travel-tvb-local -p 3003:3003 `
  -e NODE_ENV=production `
  -e PORT=3003 `
  -e DATABASE_HOST=postgres `
  -e DATABASE_PORT=5432 `
  -e DATABASE_USER=payment `
  -e DATABASE_PASSWORD=payment `
  -e DATABASE_NAME=payment_db `
  -e DATABASE_SSL=false `
  -e DATABASE_SYNCHRONIZE=true `
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/ `
  -e PAYMENT_EVENTS_EXCHANGE=payment.events `
  -e BOOKING_EVENTS_EXCHANGE=booking.events `
  -e VNPAY_RETURN_URL=http://localhost:8000/api/payments/vnpay-return `
  travel-tvb/payment-service
```

```powershell
docker run -d --name content-service --network travel-tvb-local -p 1337:1337 `
  -e NODE_ENV=production `
  -e HOST=0.0.0.0 `
  -e PORT=1337 `
  -e APP_KEYS=local-key-1,local-key-2,local-key-3,local-key-4 `
  -e API_TOKEN_SALT=local-api-token-salt `
  -e ADMIN_JWT_SECRET=local-admin-jwt-secret `
  -e TRANSFER_TOKEN_SALT=local-transfer-token-salt `
  -e ENCRYPTION_KEY=local-encryption-key `
  -e JWT_SECRET=local-content-jwt-secret `
  -e DATABASE_CLIENT=postgres `
  -e DATABASE_HOST=postgres `
  -e DATABASE_PORT=5432 `
  -e DATABASE_NAME=content_db `
  -e DATABASE_USERNAME=strapi `
  -e DATABASE_PASSWORD=strapi `
  -e DATABASE_SSL=false `
  travel-tvb/content-service
```

```powershell
docker run -d --name ai-chatbot-service --network travel-tvb-local -p 8080:8080 `
  -e APP_HOST=0.0.0.0 `
  -e APP_PORT=8080 `
  -e LOG_LEVEL=INFO `
  -e ENVIRONMENT=development `
  -e GOOGLE_AI_API_KEY=$env:GOOGLE_AI_API_KEY `
  -e CHROMADB_HOST=chromadb `
  -e CHROMADB_PORT=8000 `
  -e CHROMADB_SSL=false `
  -e CHROMA_COLLECTION=tour_embeddings `
  -e CATALOG_BASE_URL=http://catalog-service:3001 `
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/ `
  -e CATALOG_EVENTS_EXCHANGE=catalog.events `
  travel-tvb/ai-chatbot-service
```

If a container name already exists, stop and remove just that container:

```powershell
docker rm -f identity-service
```

Then rerun the matching `docker run` command.

## 8. Run the frontend

Start Vite:

```powershell
cd Travel_TVB
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend calls Kong at `http://localhost:8000`, and Kong routes requests to
the six services.

## 9. Smoke checks

Run these after the stack is up:

```powershell
Invoke-WebRequest http://localhost:8001/status
Invoke-WebRequest http://localhost:8000/api/chatbot/health
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:3001/health
Invoke-WebRequest http://localhost:3002/
Invoke-WebRequest http://localhost:3003/
Invoke-WebRequest http://localhost:1337/_health
Invoke-WebRequest http://localhost:8080/health
Invoke-WebRequest http://localhost:8800/api/v1/heartbeat
```

`/api/tours` and content endpoints return useful data only after the optional
SQLite import has been run.

## 10. Tests

Frontend:

```powershell
npm --prefix Travel_TVB test
```

NestJS services:

```powershell
npm --prefix services/identity-service test
npm --prefix services/catalog-service test
npm --prefix services/booking-service test
npm --prefix services/payment-service test
```

Content service:

```powershell
npm --prefix services/content-service test
```

AI chatbot service:

```powershell
cd services/ai-chatbot-service
.\.venv\Scripts\Activate.ps1
pytest
deactivate
cd ..\..
```

Shared libraries:

```powershell
npm --prefix libs/shared/ts test
cd libs/shared/py
python -m unittest discover tests
cd ..\..\..
```

End-to-end tests:

```powershell
npm --prefix tests/e2e test
```

The full e2e suite expects the frontend, Kong, and all service dependencies to
be running.

## 11. Stop or reset local services

Stop app service containers:

```powershell
docker rm -f identity-service catalog-service booking-service payment-service content-service ai-chatbot-service
```

Stop shared infrastructure while keeping volumes:

```powershell
docker compose -f infra/docker-compose.yml down
```

Reset shared infrastructure data:

```powershell
docker compose -f infra/docker-compose.yml down -v
```

The reset command deletes local Postgres, RabbitMQ, ChromaDB, and Redis volumes.

## Troubleshooting

### Kong returns 502 or cannot resolve a service

Kong routes to Docker DNS names from `services/api-gateway/kong.yml`, for
example `identity-service:3000`. Make sure Mode B containers are running on the
`travel-tvb-local` network:

```powershell
docker ps
docker network inspect travel-tvb-local
```

### ChromaDB works on port 8800, but the AI service cannot connect

When the AI service runs on the host, use:

```env
CHROMADB_HOST=localhost
CHROMADB_PORT=8800
```

When the AI service runs inside Docker on `travel-tvb-local`, use:

```env
CHROMADB_HOST=chromadb
CHROMADB_PORT=8000
```

### Auth works directly but fails through Kong

The local Identity Service `JWT_SECRET` must match the JWT credential configured
in `services/api-gateway/kong.yml`. The default local value is:

```env
JWT_SECRET=change-me-in-prod
```

### PostgreSQL migrations cannot connect

Check that the compose stack is running and the port is free:

```powershell
docker compose -f infra/docker-compose.yml ps postgres
```

For host-run migrations, `DATABASE_HOST` should be `localhost`. For containers,
it should be `postgres`.

### Strapi admin does not load

Rebuild the Content Service admin bundle:

```powershell
cd services/content-service
npm run build
npm run develop
```

### VNPay payment URL generation fails

Set sandbox credentials in `services/payment-service/.env` or the payment
container environment:

```env
VNPAY_TMN_CODE=<sandbox terminal code>
VNPAY_HASH_SECRET=<sandbox hash secret>
```

### Frontend still calls an old API host

Vite prefers `.env.local` over `.env`. Confirm `Travel_TVB/.env.local` contains:

```env
VITE_API_GATEWAY_URL=http://localhost:8000
```

Then restart `npm run dev`.

## Reference folders

| Path | Purpose |
| --- | --- |
| `Travel_TVB/` | React frontend |
| `services/` | Extracted microservices and Kong config |
| `libs/shared/` | Shared TS and Python helpers |
| `infra/` | Docker Compose, Kubernetes, observability, reverse proxy, backups |
| `tests/e2e/` | Playwright end-to-end suite |
| `tests/chaos/` | Chaos and resilience scenarios |
| `archives/sqlite-final.db` | Final archived monolith SQLite snapshot |
| `Travel_TVB_Server/` | Legacy Strapi monolith kept for reference during migration |
