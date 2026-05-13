# Infrastructure Workspace

Infrastructure definitions for the microservices stack live here.

## Local Stack

Start shared dependencies and the Kong gateway:

```bash
docker compose -f infra/docker-compose.yml up
```

The compose stack provides:

- PostgreSQL on `localhost:5432` with separate local databases and owners for `identity_db`, `catalog_db`, `booking_db`, `payment_db`, and `content_db`.
- RabbitMQ on `localhost:5672` with the management UI on `localhost:15672`.
- ChromaDB on `localhost:8800` mapped to container port `8000`.
- Redis on `localhost:6379`.
- Kong in DB-less mode on `localhost:8000`, with the admin API on `localhost:8001`, loading `services/api-gateway/kong.yml`.

The shared Docker network is named `travel-tvb-local` so service-specific compose files can join the same network during migration.

RabbitMQ loads its local exchange/queue topology from `rabbitmq/definitions.json`.

## Kubernetes

The `k8s/` folder is reserved for Kubernetes manifests, ingress, HPAs, and environment namespaces.
