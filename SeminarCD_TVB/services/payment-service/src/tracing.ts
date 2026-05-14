import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

process.env.OTEL_SERVICE_NAME ??= 'payment-service';
process.env.OTEL_PROPAGATORS ??= 'tracecontext,baggage';

let sdk: NodeSDK | undefined;

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  try {
    sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
  } catch (error) {
    console.error('OpenTelemetry failed to start', error);
  }
}

async function shutdownTracing(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('OpenTelemetry failed to shut down cleanly', error);
  }
}

process.once('SIGTERM', () => void shutdownTracing());
process.once('SIGINT', () => void shutdownTracing());
