# Travel TVB Operational Runbooks

These runbooks support Phase 7 maintenance for the Travel TVB microservices platform.

## Plan Section 7.3 Runbooks

| Scenario | Runbook |
|---|---|
| Service won't start | [Service Down or Won't Start](service-down.md) |
| RabbitMQ queue backlog | [RabbitMQ Queue Backlog](rabbitmq-queue-backlog.md) |
| Database migration failure | [Database Migration Failure](database-migration-failure.md) |
| VNPay callback failures | [VNPay Callback Failures](vnpay-callback-failures.md) |

## Alert Triage

| Grafana alert | Triage |
|---|---|
| `travel_tvb_service_down` | [Service Down or Won't Start](service-down.md) |
| `travel_tvb_high_error_rate` | [High Error Rate](high-error-rate.md) |
| `travel_tvb_high_p99_latency` | [High Latency](high-latency.md) |

Keep commands scoped to the affected namespace. Replace `<namespace>` with `staging`, `production`, or the namespace where the base manifests are installed.
