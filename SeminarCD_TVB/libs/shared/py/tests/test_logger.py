import json
import logging
import unittest

from travel_tvb_shared.logger import JsonFormatter, build_log_record


class LoggerTests(unittest.TestCase):
    def test_build_log_record_includes_service_and_trace(self) -> None:
        record = build_log_record("catalog-service", "info", "tour updated", trace_id="trace-1")

        self.assertEqual(record["service_name"], "catalog-service")
        self.assertEqual(record["trace_id"], "trace-1")
        self.assertEqual(record["message"], "tour updated")

    def test_json_formatter_outputs_json(self) -> None:
        formatter = JsonFormatter("booking-service")
        log_record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname=__file__,
            lineno=1,
            msg="payment failed",
            args=(),
            exc_info=None,
        )
        log_record.trace_id = "trace-2"

        parsed = json.loads(formatter.format(log_record))

        self.assertEqual(parsed["service_name"], "booking-service")
        self.assertEqual(parsed["trace_id"], "trace-2")
        self.assertEqual(parsed["level"], "error")
