'use strict';

process.env.OTEL_SERVICE_NAME ||= 'content-service';
process.env.OTEL_PROPAGATORS ||= 'tracecontext,baggage';

let sdk;

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  try {
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { NodeSDK } = require('@opentelemetry/sdk-node');

    sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
  } catch (error) {
    console.error('OpenTelemetry failed to start', error);
  }
}

async function shutdownTracing() {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('OpenTelemetry failed to shut down cleanly', error);
  }
}

process.once('SIGTERM', () => void shutdownTracing());
process.once('SIGINT', () => void shutdownTracing());
