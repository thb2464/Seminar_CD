from fastapi.testclient import TestClient
from prometheus_client import generate_latest

from app.metrics import REGISTRY, observe_catalog_event_lag, record_catalog_event


def test_metrics_endpoint_exposes_http_metrics(client: TestClient) -> None:
    client.get("/health")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert "http_requests_total" in response.text
    assert "ai-chatbot-service" in response.text


def test_catalog_event_metrics_are_rendered() -> None:
    record_catalog_event("TourUpdated", "success")
    observe_catalog_event_lag("TourUpdated", "2026-05-14T00:00:00Z")

    output = generate_latest(REGISTRY).decode()

    assert 'ai_chatbot_catalog_events_total{event_type="TourUpdated"' in output
    assert "ai_chatbot_catalog_event_lag_seconds_bucket" in output
