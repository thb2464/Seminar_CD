# Logging Stack

Kustomize workspace for Phase 7 M1: Fluent Bit collects service stdout logs,
enriches them with Kubernetes metadata, writes daily `travel-tvb-*` indices to
Elasticsearch, and Kibana reads from the same cluster.

This is a baseline staging/demo stack. Before exposing Kibana outside the
cluster, replace the single-node Elasticsearch manifest with managed Elastic or
ECK, enable TLS/auth, and add backups.

## Components

- `elasticsearch`: single-node StatefulSet with a 10Gi persistent volume.
- `kibana`: internal ClusterIP Deployment for log exploration.
- `fluent-bit`: DaemonSet tailing `/var/log/containers/*.log`.

## Render

```bash
kubectl kustomize infra/k8s/observability/logging
```

## Apply

```bash
kubectl apply -k infra/k8s/observability/logging
```

Open Kibana through a local port-forward:

```bash
kubectl -n logging port-forward svc/kibana 5601:5601
```
