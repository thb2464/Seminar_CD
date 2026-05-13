import { buildLogRecord, createJsonLogger } from "./logger.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const record = buildLogRecord("catalog-service", "info", "tour updated", {
  trace_id: "trace-1",
  tour_id: 12,
});

assert(record.service_name === "catalog-service", "record should include service_name");
assert(record.trace_id === "trace-1", "record should include trace_id");
assert(record.tour_id === 12, "record should preserve extra fields");

const lines: string[] = [];
const logger = createJsonLogger("booking-service", (line) => lines.push(line));
logger.error("payment failed", { trace_id: "trace-2", booking_id: 99 });

const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
assert(parsed.service_name === "booking-service", "logger should include service_name");
assert(parsed.trace_id === "trace-2", "logger should include trace_id");
assert(parsed.booking_id === 99, "logger should include extra fields");
assert(parsed.level === "error", "logger should include level");
