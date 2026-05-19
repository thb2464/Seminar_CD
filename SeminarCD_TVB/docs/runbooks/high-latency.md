# High Latency

Grafana alert: `travel_tvb_high_p99_latency`.

Use this when service P99 HTTP latency stays above 2 seconds for 5 minutes.

## First Checks

```bash
kubectl -n <namespace> top pod
kubectl -n <namespace> logs deploy/<service-name> --since=15m
```

PromQL:

```promql
histogram_quantile(0.99, sum by (le, service, path) (rate(http_request_duration_seconds_bucket[5m])))
sum by (service) (rate(http_requests_total[5m]))
sum by (service) (nodejs_process_resident_memory_bytes) or sum by (service) (process_resident_memory_bytes)
```

## Route To Scenario Runbook

- Consumer lag or saga delays: [RabbitMQ Queue Backlog](rabbitmq-queue-backlog.md)
- Database lock, migration, or schema change: [Database Migration Failure](database-migration-failure.md)
- Pod restarts or readiness flapping: [Service Down or Won't Start](service-down.md)
- Payment callback path latency: [VNPay Callback Failures](vnpay-callback-failures.md)

## Stabilise

1. Confirm whether latency is isolated to one route or all routes in the service.
2. Scale stateless read paths if CPU/memory is saturated.
3. Pause non-critical migrations, indexing jobs, or bulk imports if they are competing for database resources.
4. Roll back the last deploy if latency started immediately after release.
