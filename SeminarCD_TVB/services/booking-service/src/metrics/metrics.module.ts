import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Global,
  Injectable,
  Module,
  NestInterceptor,
  Res,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import { catchError, Observable, tap, throwError } from 'rxjs';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'booking-service';

function secondsSince(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
}

function requestPath(request: Request): string {
  const routePath = request.route?.path;
  const baseUrl = request.baseUrl ?? '';
  if (typeof routePath === 'string') {
    return `${baseUrl}${routePath}` || '/';
  }
  return request.path || request.url || 'unknown';
}

function statusFromError(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isFinite(status) ? status : 500;
  }
  return 500;
}

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests handled by the service.',
    labelNames: ['service', 'method', 'path', 'status_code'],
    registers: [this.registry],
  });
  private readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds.',
    labelNames: ['service', 'method', 'path', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });
  private readonly eventPublishes = new Counter({
    name: 'domain_events_published_total',
    help: 'Domain events published to the event bus.',
    labelNames: ['service', 'exchange', 'event_type', 'outcome'],
    registers: [this.registry],
  });
  private readonly eventPublishDuration = new Histogram({
    name: 'domain_event_publish_duration_seconds',
    help: 'Domain event publish duration in seconds.',
    labelNames: ['service', 'exchange', 'event_type', 'outcome'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  constructor() {
    this.registry.setDefaultLabels({ service: serviceName });
    collectDefaultMetrics({ register: this.registry, prefix: 'nodejs_' });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      service: serviceName,
      method,
      path,
      status_code: String(statusCode),
    };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationSeconds);
  }

  recordEventPublish(
    exchange: string,
    eventType: string,
    outcome: string,
    durationSeconds: number,
  ): void {
    const labels = {
      service: serviceName,
      exchange,
      event_type: eventType,
      outcome,
    };
    this.eventPublishes.inc(labels);
    this.eventPublishDuration.observe(labels, durationSeconds);
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (request.path === '/metrics') {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    const method = request.method;
    const path = requestPath(request);

    return next.handle().pipe(
      tap(() => {
        this.metrics.recordHttpRequest(
          method,
          path,
          response.statusCode,
          secondsSince(startedAt),
        );
      }),
      catchError((error: unknown) => {
        this.metrics.recordHttpRequest(
          method,
          path,
          statusFromError(error),
          secondsSince(startedAt),
        );
        return throwError(() => error);
      }),
    );
  }
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async scrape(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.contentType);
    response.send(await this.metrics.render());
  }
}

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
