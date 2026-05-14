# High Error Rate

Grafana alert: `travel_tvb_high_error_rate`.

Use this as a fast triage page when a service has more than 5% HTTP 5xx responses for 5 minutes.

## First Checks

```bash
kubectl -n <namespace> get pods -l app.kubernetes.io/part-of=travel-tvb
kubectl -n <namespace> logs deploy/<service-name> --since=15m
```

PromQL:

```promql
sum by (service, path, status_code) (rate(http_requests_total{status_code=~"5.."}[5m]))
histogram_quantile(0.99, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))
```

## Route To Scenario Runbook

- Pod restarts, readiness failures, or config errors: [Service Down or Won't Start](service-down.md)
- Payment callback errors: [VNPay Callback Failures](vnpay-callback-failures.md)
- Errors immediately after deploy or migration: [Database Migration Failure](database-migration-failure.md)
- Event publish/consume failures and retries: [RabbitMQ Queue Backlog](rabbitmq-queue-backlog.md)

## Stabilise

1. Roll back the affected Deployment if errors started immediately after a deploy.
2. Scale read-heavy services only if CPU/memory saturation is the bottleneck.
3. Keep Booking and Payment writes enabled only if the saga is healthy.
