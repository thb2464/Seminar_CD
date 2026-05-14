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
  BookingEventEnvelope,
  BookingEventPayload,
  BookingEventType,
  BOOKING_CANCELLED,
  BOOKING_CREATED,
  toBookingPayload,
} from './booking-event.types';
import type { Booking } from '../booking/entities/booking.entity';
import { MetricsService } from '../metrics/metrics.module';

export const AMQP_CONNECTION = Symbol('AMQP_CONNECTION');

export interface PublisherDependencies {
  connect: (urls: string[] | string) => AmqpConnectionManager;
}

@Injectable()
export class BookingEventsPublisher
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(BookingEventsPublisher.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION)
    private readonly deps: PublisherDependencies,
    @Optional()
    private readonly metrics?: MetricsService,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn(
        'RABBITMQ_URL is not set - booking events will be dropped',
      );
      return;
    }
    this.connection = this.deps.connect(url);
    const exchange = this.exchangeName();
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: import('amqplib').ConfirmChannel) => {
        await ch.assertExchange(exchange, 'topic', { durable: true });
      },
    });
    this.connection.on('connect', () => this.logger.log(`connected to ${url}`));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`disconnected: ${err?.message ?? 'no detail'}`),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
    }
    if (this.connection) {
      await this.connection.close().catch(() => undefined);
    }
  }

  publishBookingCreated(booking: Booking): Promise<void> {
    return this.publish(BOOKING_CREATED, toBookingPayload(booking));
  }

  publishBookingCancelled(booking: Booking): Promise<void> {
    return this.publish(BOOKING_CANCELLED, toBookingPayload(booking));
  }

  async publish(
    type: BookingEventType,
    payload: BookingEventPayload,
  ): Promise<void> {
    const exchange = this.exchangeName();
    const startedAt = process.hrtime.bigint();
    if (!this.channel) {
      this.logger.warn(
        `channel not ready - dropping ${type} for booking ${payload.id}`,
      );
      this.metrics?.recordEventPublish(
        exchange,
        type,
        'dropped',
        this.secondsSince(startedAt),
      );
      return;
    }
    const envelope: BookingEventEnvelope<BookingEventPayload> = {
      type,
      occurredAt: new Date().toISOString(),
      service: 'booking-service',
      payload,
    };
    let outcome = 'success';
    try {
      await this.channel.publish(exchange, type, envelope, {
        contentType: 'application/json',
        persistent: true,
        messageId: `${type}:${payload.id}`,
      });
    } catch (err) {
      outcome = 'failure';
      this.logger.error(
        `failed to publish ${type} for booking ${payload.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
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
    return this.config.get<string>('BOOKING_EVENTS_EXCHANGE', 'booking.events');
  }

  private secondsSince(startedAt: bigint): number {
    return Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
  }
}
