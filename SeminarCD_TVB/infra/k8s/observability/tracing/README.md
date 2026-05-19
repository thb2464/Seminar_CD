# Tracing Stack

Kustomize workspace for Phase 7 M2. Jaeger all-in-one receives OTLP traces from
the service SDKs and exposes the Jaeger UI inside the cluster.

This is an in-memory staging/demo backend. Production should use durable Jaeger
storage, sampling policy, and access controls before exposing the UI.

## Render

```bash
kubectl kustomize infra/k8s/observability/tracing
```

## Apply

```bash
kubectl apply -k infra/k8s/observability/tracing
```

Open Jaeger through a local port-forward:

```bash
kubectl -n tracing port-forward svc/jaeger-query 16686:16686
```
