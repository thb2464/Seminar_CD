# RabbitMQ Queue Backlog

Plan section 7.3 scenario: RabbitMQ queue backlog.

Use this when booking, payment, or catalog events accumulate faster than consumers process them.

## Quick Triage

1. Check RabbitMQ pod health and management UI.

   ```bash
   kubectl -n <namespace> get pod,svc -l app.kubernetes.io/name=rabbitmq
   kubectl -n <namespace> port-forward svc/rabbitmq 15672:15672
   ```

2. Inspect queue depth and consumer count in the RabbitMQ UI, or use the management API if credentials are available.

   ```bash
   curl -u '<user>:<password>' http://localhost:15672/api/queues
   ```

3. Identify the affected queue and routing path.

   | Queue or exchange | Owner | Expected consumer |
   |---|---|---|
   | `booking.events` | Booking Service | Payment Service |
   | `payment.events` | Payment Service | Booking Service |
   | `catalog.events` | Catalog Service | AI Chatbot Service |
   | `chatbot.catalog.tour-changed` | AI Chatbot Service | AI Chatbot catalog consumer |
   | `chatbot.catalog.tour-deleted` | AI Chatbot Service | AI Chatbot catalog consumer |

4. Check consumer logs.

   ```bash
   kubectl -n <namespace> logs deploy/payment-service --tail=200
   kubectl -n <namespace> logs deploy/booking-service --tail=200
   kubectl -n <namespace> logs deploy/ai-chatbot-service --tail=200
   ```

## Metrics

Use Grafana's Booking Pipeline and AI Chatbot dashboards.

PromQL:

```promql
sum by (service, event_type, outcome) (rate(domain_events_published_total[5m]))
histogram_quantile(0.95, sum by (le, service, event_type) (rate(domain_event_publish_duration_seconds_bucket[5m])))
sum by (event_type, outcome) (increase(ai_chatbot_catalog_events_total[1h]))
histogram_quantile(0.95, sum by (le, event_type) (rate(ai_chatbot_catalog_event_lag_seconds_bucket[5m])))
```

## Recovery

1. If consumers are down, follow [Service Down or Won't Start](service-down.md) for the consumer service.
2. If consumers are healthy but slow, scale the consumer Deployment temporarily.

   ```bash
   kubectl -n <namespace> scale deploy/payment-service --replicas=3
   kubectl -n <namespace> scale deploy/booking-service --replicas=3
   kubectl -n <namespace> scale deploy/ai-chatbot-service --replicas=3
   ```

3. Inspect dead-letter queues before replaying or purging anything.
4. Requeue only messages that are known to be idempotent for the target consumer.
5. After the queue drains, restore the normal replica count or commit the HPA/replica change if the new load is permanent.

## Do Not

- Do not purge a queue before confirming the event type and business impact.
- Do not scale producers to zero unless the user approves a temporary write outage.
- Do not manually publish compensation events without confirming the current booking/payment database state.

## Escalation

Escalate if:

- the queue age keeps increasing for more than 15 minutes,
- dead-letter messages contain booking or payment events,
- the backlog affects payment completion, refunds, or catalog search freshness.
