# Infrastructure Workspace

Infrastructure definitions for the microservices stack live here.

Planned contents:

- `docker-compose.yml` - local PostgreSQL databases, RabbitMQ, ChromaDB, Redis, and Kong.
- `k8s/` - Kubernetes manifests, ingress, HPAs, and environment namespaces.

Service-specific standalone compose files may remain inside a service while a sprint is in progress, but shared local development and deployment infrastructure should converge here.
