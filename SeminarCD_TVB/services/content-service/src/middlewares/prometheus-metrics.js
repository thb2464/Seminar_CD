'use strict';

const client = require('prom-client');

const serviceName = process.env.OTEL_SERVICE_NAME || 'content-service';
const registry = new client.Registry();

registry.setDefaultLabels({ service: serviceName });
client.collectDefaultMetrics({ register: registry, prefix: 'nodejs_' });

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by the service.',
  labelNames: ['service', 'method', 'path', 'status_code'],
  registers: [registry],
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['service', 'method', 'path', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

function secondsSince(startedAt) {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
}

function requestPath(ctx) {
  return ctx._matchedRoute || ctx.path || 'unknown';
}

module.exports = () => async (ctx, next) => {
  if (ctx.path === '/metrics') {
    ctx.set('Content-Type', registry.contentType);
    ctx.body = await registry.metrics();
    return;
  }

  const startedAt = process.hrtime.bigint();
  try {
    await next();
  } finally {
    const labels = {
      service: serviceName,
      method: ctx.method || 'UNKNOWN',
      path: requestPath(ctx),
      status_code: String(ctx.status || 500),
    };
    httpRequests.inc(labels);
    httpDuration.observe(labels, secondsSince(startedAt));
  }
};

module.exports.registry = registry;
