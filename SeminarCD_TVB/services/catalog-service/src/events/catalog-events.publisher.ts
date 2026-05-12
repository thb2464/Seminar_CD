import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

import {
  CatalogEventEnvelope,
  CatalogEventType,
  TOUR_CREATED,
  TOUR_DELETED,
  TOUR_UPDATED,
  TourEventPayload,
  toTourPayload,
} from './catalog-event.types';
import type { Tour } from '../catalog/entities/tour.entity';

export const AMQP_CONNECTION = Symbol('AMQP_CONNECTION');

export interface PublisherDependencies {
  connect: (urls: string[] | string) => AmqpConnectionManager;
}

@Injectable()
export class CatalogEventsPublisher implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(CatalogEventsPublisher.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION)
    private readonly deps: PublisherDependencies,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL is not set — catalog events will be dropped on the floor');
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

  publishTourCreated(tour: Tour): Promise<void> {
    return this.publish(TOUR_CREATED, toTourPayload(tour));
  }

  publishTourUpdated(tour: Tour): Promise<void> {
    return this.publish(TOUR_UPDATED, toTourPayload(tour));
  }

  publishTourDeleted(tour: Tour): Promise<void> {
    return this.publish(TOUR_DELETED, toTourPayload(tour));
  }

  async publish(type: CatalogEventType, payload: TourEventPayload): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`channel not ready — dropping ${type} for tour ${payload.slug}`);
      return;
    }
    const envelope: CatalogEventEnvelope<TourEventPayload> = {
      type,
      occurredAt: new Date().toISOString(),
      service: 'catalog-service',
      payload,
    };
    try {
      await this.channel.publish(this.exchangeName(), type, envelope, {
        contentType: 'application/json',
        persistent: true,
        messageId: `${type}:${payload.id}:${payload.locale}`,
      });
    } catch (err) {
      this.logger.error(
        `failed to publish ${type} for tour ${payload.slug}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private exchangeName(): string {
    return this.config.get<string>('CATALOG_EVENTS_EXCHANGE', 'catalog.events');
  }
}
