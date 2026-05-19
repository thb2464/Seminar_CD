# Travel TVB Chaos Tests

LitmusChaos scenario definitions for Phase 5 T4 in `MICROSERVICES_PLAN.md`.

The manifests default to the `staging` namespace and set each `ChaosEngine` to
`engineState: "stop"` so rendering or applying the definitions does not start
fault injection by accident.

## Prerequisites

- The D5 `staging` Kubernetes overlay is applied and healthy.
- Litmus Chaos Operator is installed in the cluster.
- These Litmus experiments are installed in the `staging` namespace:
  `pod-delete`, `pod-network-loss`, `pod-network-latency`, and
  `pod-memory-hog`.
- RabbitMQ and Postgres service DNS names match the manifests, or the
  `DESTINATION_HOSTS` values are patched for the target environment.

## Render

```bash
kubectl kustomize tests/chaos/litmus
```

## Run One Scenario

Apply the shared RBAC and exactly one scenario manifest:

```bash
kubectl apply -f tests/chaos/litmus/rbac.yaml
kubectl apply -f tests/chaos/litmus/payment-service-crash.yaml
kubectl -n staging patch chaosengine payment-service-crash --type merge -p '{"spec":{"engineState":"active"}}'
```

Watch the result, then stop or delete the engine:

```bash
kubectl -n staging get chaosengine,chaosresult
kubectl -n staging patch chaosengine payment-service-crash --type merge -p '{"spec":{"engineState":"stop"}}'
kubectl -n staging delete chaosengine payment-service-crash
```

## Scenarios

| File | Fault | Expected behavior |
|------|-------|-------------------|
| `payment-service-crash.yaml` | Deletes one Payment pod replica. | Booking remains Pending, retry is possible, Catalog and Chatbot stay healthy. |
| `rabbitmq-outage.yaml` | Drops application egress to RabbitMQ on port 5672. | Event publishers buffer and retry with exponential backoff. |
| `catalog-db-slow.yaml` | Adds latency to Catalog -> Postgres traffic. | Catalog circuit breaker opens, cached or degraded tour data is served. |
| `ai-service-oom.yaml` | Stresses one AI Chatbot pod beyond its memory limit. | Chatbot degrades to fallback messaging, other workflows continue. |

## References

- Pod delete: https://litmuschaos.github.io/litmus/experiments/categories/pods/pod-delete/
- Pod network loss: https://litmuschaos.github.io/litmus/experiments/categories/pods/pod-network-loss/
- Pod network latency: https://litmuschaos.github.io/litmus/experiments/categories/pods/pod-network-latency/
- Pod memory hog: https://litmuschaos.github.io/litmus/experiments/categories/pods/pod-memory-hog/
