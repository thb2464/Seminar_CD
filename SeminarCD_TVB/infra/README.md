# Infrastructure Workspace

Infrastructure definitions for the microservices stack live here.

## Local Stack

Start shared dependencies and the Kong gateway:

```bash
docker compose -f infra/docker-compose.yml up
```

The compose stack provides:

- PostgreSQL on `localhost:5432` with separate local databases and owners for `identity_db`, `catalog_db`, `booking_db`, `payment_db`, and `content_db`.
- Pact Broker on `localhost:9292`, backed by its own `pact_broker_db` database. Local read/write credentials are `pact_ci` / `pact_ci`; local read-only credentials are `pact_read` / `pact_read`.
- RabbitMQ on `localhost:5672` with the management UI on `localhost:15672`.
- ChromaDB on `localhost:8800` mapped to container port `8000`.
- Redis on `localhost:6379`.
- Kong in DB-less mode on `localhost:8000`, with the admin API on `localhost:8001`, loading `services/api-gateway/kong.yml`.

The shared Docker network is named `travel-tvb-local` so service-specific compose files can join the same network during migration.

RabbitMQ loads its local exchange/queue topology from `rabbitmq/definitions.json`.

Pact Broker usage and CI variable setup are documented in `docs/testing/pact-broker.md`.

## Kubernetes

The `k8s/` folder contains the base Kubernetes manifests for service Deployments,
ClusterIP Services, and the public Kong gateway Ingress. HPAs,
environment-specific namespaces/secrets, and the Phase 7 logging/tracing/metrics
stacks are layered alongside the base. Maintenance jobs under `k8s/maintenance/`
cover PostgreSQL and ChromaDB backup/restore operations.

## Production Reverse Proxy

The `reverse-proxy/` folder contains the Sprint 7 cutover config for routing the
production API hostname to Kong only. Use `docs/runbooks/dns-kong-cutover.md`
as the checklist for DNS and proxy validation.
