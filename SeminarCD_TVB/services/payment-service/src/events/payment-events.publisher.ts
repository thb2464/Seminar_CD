import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';

import {
  PaymentEventEnvelope,
  PaymentEventPayload,
  PaymentEventType,
} from './payment-event.types';
import { MetricsService } from '../metrics/metrics.module';

export const AMQP_CONNECTION = Symbol('AMQP_CONNECTION');

export interface PublisherDependencies {
  connect: (urls: string[] | string) => AmqpConnectionManager;
}

@Injectable()
export class PaymentEventsPublisher
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(PaymentEventsPublisher.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION) private readonly deps: PublisherDependencies,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) return;
    this.connection = this.deps.connect(url);
    const exchange = this.exchangeName();
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: import('amqplib').ConfirmChannel) => {
        await ch.assertExchange(exchange, 'topic', { durable: true });
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.channel) await this.channel.close().catch(() => undefined);
    if (this.connection) await this.connection.close().catch(() => undefined);
  }

  async publish(
    type: PaymentEventType,
    payload: PaymentEventPayload,
  ): Promise<void> {
    const exchange = this.exchangeName();
    const startedAt = process.hrtime.bigint();
    if (!this.channel) {
      this.metrics?.recordEventPublish(
        exchange,
        type,
        'dropped',
        this.secondsSince(startedAt),
      );
      return;
    }
    const envelope: PaymentEventEnvelope<PaymentEventPayload> = {
      type,
      occurredAt: new Date().toISOString(),
      service: 'payment-service',
      payload,
    };
    let outcome = 'success';
    try {
      await this.channel.publish(exchange, type, envelope, {
        contentType: 'application/json',
        persistent: true,
        messageId: `${type}:${payload.bookingId}`,
      });
    } catch (err) {
      outcome = 'failure';
      this.logger.error(`failed to publish ${type}: ${err}`);
    } finally {
      this.metrics?.recordEventPublish(
        exchange,
        type,
        outcome,
        this.secondsSince(startedAt),
      );
    }
  }

  private exchangeName(): string {
    return this.config.get('PAYMENT_EVENTS_EXCHANGE', 'payment.events');
  }

  private secondsSince(startedAt: bigint): number {
    return Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
  }
}
