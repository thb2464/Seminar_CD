from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any


def build_log_record(
    service_name: str,
    level: str,
    message: str,
    **fields: Any,
) -> dict[str, Any]:
    trace_id = fields.get("trace_id")

    return {
        **fields,
        "timestamp": datetime.now(UTC).isoformat(),
        "level": level,
        "message": message,
        "service_name": service_name,
        "trace_id": trace_id if isinstance(trace_id, str) else "unknown",
    }


class JsonFormatter(logging.Formatter):
    def __init__(self, service_name: str) -> None:
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        fields = {
            "logger": record.name,
        }

        trace_id = getattr(record, "trace_id", None)
        if isinstance(trace_id, str):
            fields["trace_id"] = trace_id

        if record.exc_info:
            fields["exception"] = self.formatException(record.exc_info)

        return json.dumps(
            build_log_record(
                self.service_name,
                record.levelname.lower(),
                record.getMessage(),
                **fields,
            ),
            ensure_ascii=False,
        )


def configure_json_logging(service_name: str, level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter(service_name))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
