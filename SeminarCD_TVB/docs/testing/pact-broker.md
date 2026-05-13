# Pact Broker

Phase 5 uses a self-hosted Pact Broker for consumer/provider contract publishing and verification.

## Local Broker

Start the local broker with the shared infrastructure stack:

```bash
docker compose -f infra/docker-compose.yml up pact-broker
```

The broker is available at `http://localhost:9292`.

Local credentials:

- Read/write: `pact_ci` / `pact_ci`
- Read-only: `pact_read` / `pact_read`

The broker has its own PostgreSQL database, `pact_broker_db`, created by `infra/postgres/init-databases.sql`.

If `postgres-data` already exists, recreate the volume before expecting the new database to appear:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up pact-broker
```

## CI Variables

The reusable service workflow reads Pact Broker connection details from repository variables and secrets:

- `vars.PACT_BROKER_BASE_URL`
- `secrets.PACT_BROKER_USERNAME`
- `secrets.PACT_BROKER_PASSWORD`
- `secrets.PACT_BROKER_TOKEN` for PactFlow or any bearer-token-compatible broker

For the OSS self-hosted broker, prefer the username/password pair. The local credentials above are for development only; staging and production CI should use rotated credentials stored in GitHub Secrets.

## Service Convention

Consumer Pact files should be written under each service's `pacts/` directory. The reusable service workflow publishes that directory when it exists and a broker URL is configured.

Provider verification should be exposed as a service-local script named `pact:verify`. The reusable workflow calls `npm run pact:verify --if-present` for Node services after normal unit tests. Python services can add broker verification under their PyTest suite and publish JSON pact files from the same `pacts/` convention.
