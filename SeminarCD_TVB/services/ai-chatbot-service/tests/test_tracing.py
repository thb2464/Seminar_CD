from fastapi import FastAPI

from app import tracing


def test_configure_tracing_respects_disabled_env(monkeypatch) -> None:
    monkeypatch.setattr(tracing, "_configured", False)
    monkeypatch.setenv("OTEL_SDK_DISABLED", "true")

    tracing.configure_tracing(FastAPI())

    assert tracing._configured is False


def test_configure_tracing_wires_exporter_and_instrumentors(monkeypatch) -> None:
    calls: dict[str, object] = {}

    class FakeProvider:
        def __init__(self, resource: object) -> None:
            self.resource = resource
            self.processor = None

        def add_span_processor(self, processor: object) -> None:
            self.processor = processor

    class FakeHttpxInstrumentor:
        def instrument(self) -> None:
            calls["httpx"] = True

    monkeypatch.setattr(tracing, "_configured", False)
    monkeypatch.setenv("OTEL_SDK_DISABLED", "false")
    monkeypatch.setenv("OTEL_SERVICE_NAME", "ai-chatbot-test")
    monkeypatch.setattr(tracing, "TracerProvider", FakeProvider)
    monkeypatch.setattr(tracing, "OTLPSpanExporter", lambda: "exporter")
    monkeypatch.setattr(
        tracing,
        "BatchSpanProcessor",
        lambda exporter: ("processor", exporter),
    )
    monkeypatch.setattr(
        tracing.trace,
        "set_tracer_provider",
        lambda provider: calls.setdefault("provider", provider),
    )
    monkeypatch.setattr(
        tracing.FastAPIInstrumentor,
        "instrument_app",
        lambda app, excluded_urls: calls.update({"app": app, "excluded_urls": excluded_urls}),
    )
    monkeypatch.setattr(tracing, "HTTPXClientInstrumentor", lambda: FakeHttpxInstrumentor())

    app = FastAPI()
    tracing.configure_tracing(app)

    assert tracing._configured is True
    assert calls["app"] is app
    assert calls["excluded_urls"] == "/health"
    assert calls["httpx"] is True
    assert isinstance(calls["provider"], FakeProvider)
