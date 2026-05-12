import json
import logging
from io import StringIO

from app.logging import SERVICE_NAME, ServiceJsonFormatter, configure_logging


def test_formatter_emits_service_name_and_level() -> None:
    formatter = ServiceJsonFormatter("%(asctime)s %(level)s %(name)s %(message)s")
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )
    rendered = formatter.format(record)
    payload = json.loads(rendered)
    assert payload["service_name"] == SERVICE_NAME
    assert payload["level"] == "INFO"
    assert payload["message"] == "hello world"


def test_configure_logging_replaces_handlers() -> None:
    root = logging.getLogger()
    previous = list(root.handlers)
    try:
        configure_logging("DEBUG")
        assert len(root.handlers) == 1
        assert root.level == logging.DEBUG
    finally:
        root.handlers = previous


def test_logger_pipeline_writes_json() -> None:
    buffer = StringIO()
    handler = logging.StreamHandler(buffer)
    handler.setFormatter(ServiceJsonFormatter("%(asctime)s %(level)s %(name)s %(message)s"))
    logger = logging.getLogger("test-pipeline")
    logger.handlers = [handler]
    logger.setLevel(logging.INFO)
    logger.info("structured event", extra={"trace_id": "abc"})

    line = buffer.getvalue().strip()
    payload = json.loads(line)
    assert payload["message"] == "structured event"
    assert payload["service_name"] == SERVICE_NAME
    assert payload["trace_id"] == "abc"
