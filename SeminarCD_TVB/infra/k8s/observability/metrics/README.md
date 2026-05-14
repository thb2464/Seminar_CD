# Travel TVB Metrics Stack

Phase 7 M3 adds Prometheus scraping and Grafana dashboards for the microservice rollout.

## Components

- `prometheus` in namespace `metrics`
  - Discovers all endpoints whose Service has `app.kubernetes.io/part-of=travel-tvb` and port name `http`.
  - Scrapes Kong separately on the `admin` port so the gateway `prometheus` plugin can expose `/metrics`.
  - Keeps an annotation-based `annotated-pods` job for future exporters.
- `grafana` in namespace `metrics`
  - Provisions Prometheus as the default datasource.
  - Loads four dashboards from `grafana-dashboards.yaml`:
    - Travel TVB - Service Health
    - Travel TVB - Booking Pipeline
    - Travel TVB - AI Chatbot
    - Travel TVB - Infrastructure

## Apply

```bash
kubectl apply -k infra/k8s/observability/metrics
```

## Local Access

```bash
kubectl -n metrics port-forward svc/prometheus 9090:9090
kubectl -n metrics port-forward svc/grafana 3000:3000
```

Grafana anonymous viewer access is enabled because the Service is `ClusterIP` only. Put it behind SSO or an authenticated ingress before exposing it outside the cluster.

## Expected Metrics

- `http_requests_total`
- `http_request_duration_seconds`
- `domain_events_published_total`
- `domain_event_publish_duration_seconds`
- `ai_chatbot_catalog_events_total`
- `ai_chatbot_catalog_event_lag_seconds`
- Kong `kong_*` metrics from the global gateway `prometheus` plugin.
