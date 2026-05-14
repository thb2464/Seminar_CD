from __future__ import annotations

import os
import time
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    GCCollector,
    Histogram,
    PlatformCollector,
    ProcessCollector,
    generate_latest,
)

SERVICE_NAME = os.getenv("OTEL_SERVICE_NAME", "ai-chatbot-service")
REGISTRY = CollectorRegistry()

ProcessCollector(namespace="", registry=REGISTRY)
PlatformCollector(registry=REGISTRY)
GCCollector(registry=REGISTRY)

HTTP_REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests handled by the service.",
    ["service", "method", "path", "status_code"],
    registry=REGISTRY,
)
HTTP_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds.",
    ["service", "method", "path", "status_code"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
    registry=REGISTRY,
)
CATALOG_EVENTS = Counter(
    "ai_chatbot_catalog_events_total",
    "Catalog domain events handled by the chatbot projection consumer.",
    ["service", "event_type", "outcome"],
    registry=REGISTRY,
)
CATALOG_EVENT_LAG = Histogram(
    "ai_chatbot_catalog_event_lag_seconds",
    "Lag between catalog event occurrence and chatbot consumer handling.",
    ["service", "event_type"],
    buckets=(0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 900),
    registry=REGISTRY,
)


def configure_metrics(app: FastAPI) -> None:
    @app.middleware("http")
    async def metrics_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path == "/metrics":
            return await call_next(request)

        started_at = time.perf_counter()
        path = _request_path(request)
        try:
            response = await call_next(request)
        except Exception:
            _record_http(request.method, path, 500, time.perf_counter() - started_at)
            raise
        _record_http(request.method, path, response.status_code, time.perf_counter() - started_at)
        return response

    @app.get("/metrics", include_in_schema=False)
    async def metrics() -> Response:
        return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)


def record_catalog_event(event_type: str | None, outcome: str) -> None:
    CATALOG_EVENTS.labels(
        service=SERVICE_NAME,
        event_type=event_type or "unknown",
        outcome=outcome,
    ).inc()


def observe_catalog_event_lag(event_type: str | None, occurred_at: str | None) -> None:
    occurred = _parse_datetime(occurred_at)
    if occurred is None:
        return
    lag_seconds = max((datetime.now(UTC) - occurred).total_seconds(), 0.0)
    CATALOG_EVENT_LAG.labels(
        service=SERVICE_NAME,
        event_type=event_type or "unknown",
    ).observe(lag_seconds)


def _record_http(method: str, path: str, status_code: int, duration_seconds: float) -> None:
    labels = {
        "service": SERVICE_NAME,
        "method": method,
        "path": path,
        "status_code": str(status_code),
    }
    HTTP_REQUESTS.labels(**labels).inc()
    HTTP_DURATION.labels(**labels).observe(duration_seconds)


def _request_path(request: Request) -> str:
    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    return route_path if isinstance(route_path, str) else request.url.path


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)
