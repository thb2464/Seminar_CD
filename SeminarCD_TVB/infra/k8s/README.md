# Kubernetes Manifests

Base Kubernetes manifests for the Travel TVB microservices live in `base/`.

```bash
kubectl kustomize infra/k8s/base
```

The base keeps service traffic behind Kong:

- `api-gateway` is the only public Ingress target.
- Downstream services are `ClusterIP` Services.
- Catalog and AI Chatbot include HPAs in the base because they are the planned independently scalable read/AI paths.
- Service Deployments reference placeholder Secret names documented in `base/runtime-secrets.example.yaml`.
- Environment namespaces and real secret management live in `overlays/`.

## Environment Overlays

`overlays/staging` and `overlays/production` apply the base into the target
namespace, patch the public API hostname, and create ExternalSecret resources
for each runtime Secret consumed by the Deployments.

The overlays expect External Secrets Operator CRDs (`external-secrets.io/v1`)
and a cluster-scoped store named `travel-tvb-cluster-secret-store`.

```bash
kubectl kustomize infra/k8s/overlays/staging
kubectl kustomize infra/k8s/overlays/production
```

## Observability

Phase 7 logging manifests live in `observability/logging`. The workspace creates
the `logging` namespace, a baseline Elasticsearch StatefulSet, Kibana, and a
Fluent Bit DaemonSet that ships Kubernetes container stdout logs to
Elasticsearch.

```bash
kubectl kustomize infra/k8s/observability/logging
```
