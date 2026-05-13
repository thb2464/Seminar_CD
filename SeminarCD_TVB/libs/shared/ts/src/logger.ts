export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;
export type LogSink = (line: string) => void;

export interface JsonLogRecord extends LogFields {
  timestamp: string;
  level: LogLevel;
  message: string;
  service_name: string;
  trace_id: string;
}

export interface JsonLogger {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
}

export function buildLogRecord(
  serviceName: string,
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): JsonLogRecord {
  const traceId = typeof fields.trace_id === "string" ? fields.trace_id : "unknown";

  return {
    ...fields,
    timestamp: new Date().toISOString(),
    level,
    message,
    service_name: serviceName,
    trace_id: traceId,
  };
}

export function createJsonLogger(serviceName: string, sink: LogSink = (line) => console.log(line)): JsonLogger {
  const write = (level: LogLevel, message: string, fields: LogFields = {}): void => {
    sink(JSON.stringify(buildLogRecord(serviceName, level, message, fields)));
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
  };
}
