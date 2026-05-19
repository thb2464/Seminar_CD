# Service Down or Won't Start

Plan section 7.3 scenario: Service won't start.

Use this when a Deployment has unavailable replicas, pods are stuck in `CrashLoopBackOff`, or the Grafana `travel_tvb_service_down` alert fires.

## Quick Triage

1. Identify the affected service and namespace.

   ```bash
   kubectl -n <namespace> get deploy,pod,svc -l app.kubernetes.io/part-of=travel-tvb
   kubectl -n <namespace> describe deploy <service-name>
   ```

2. Check current and previous container logs.

   ```bash
   kubectl -n <namespace> logs deploy/<service-name> --tail=200
   kubectl -n <namespace> logs deploy/<service-name> --previous --tail=200
   ```

3. Verify configuration and Secret wiring.

   ```bash
   kubectl -n <namespace> describe pod -l app.kubernetes.io/name=<service-name>
   kubectl -n <namespace> get configmap travel-tvb-runtime-config -o yaml
   kubectl -n <namespace> get secret <service-secret-name>
   ```

4. Verify database or broker connectivity for services that need it.

   ```bash
   kubectl -n <namespace> exec deploy/<service-name> -- printenv | rg "DATABASE_|RABBITMQ_|CHROMA|VNPAY"
   kubectl -n <namespace> get endpoints
   ```

## Service-Specific Checks

- Identity, Catalog, Booking, Payment, Content: confirm `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, and `DATABASE_PASSWORD` are present.
- Booking, Payment, AI Chatbot: confirm `RABBITMQ_URL` is present and points at the RabbitMQ Service.
- AI Chatbot: confirm `GOOGLE_AI_API_KEY`, ChromaDB host/port, and RabbitMQ settings.
- Content Service: confirm Strapi app keys, admin JWT secret, transfer token salt, and database SSL mode.
- API Gateway: confirm `KONG_DECLARATIVE_CONFIG` points at the mounted DB-less config and Kong passes `kong health`.

## Recovery

1. Fix missing or incorrect config through the environment overlay, ExternalSecret backend, or the relevant Secret source.
2. Restart only the affected Deployment.

   ```bash
   kubectl -n <namespace> rollout restart deploy/<service-name>
   kubectl -n <namespace> rollout status deploy/<service-name>
   ```

3. Confirm readiness and metrics recovery.

   ```bash
   kubectl -n <namespace> get pods -l app.kubernetes.io/name=<service-name>
   kubectl -n metrics port-forward svc/prometheus 9090:9090
   ```

   In Prometheus, check:

   ```promql
   up{service="<service-name>"}
   sum by (service) (rate(http_requests_total{service="<service-name>"}[5m]))
   ```

## Escalation

Escalate to the platform owner if:

- the Deployment cannot become ready after one config fix and one rollout restart,
- database credentials are missing from the external secret store,
- the same pod restarts more than three times in 10 minutes,
- the service is on the booking/payment path and production bookings are blocked.

## Rollback

Rollback to the previous known-good image or overlay revision.

```bash
kubectl -n <namespace> rollout undo deploy/<service-name>
kubectl -n <namespace> rollout status deploy/<service-name>
```

Do not route public traffic back to the monolith unless the user explicitly approves a production rollback strategy.
