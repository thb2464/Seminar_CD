import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

import { PaymentEventEnvelope, PaymentEventType, PaymentEventPayload } from './payment-event.types';

export const AMQP_CONNECTION = Symbol('AMQP_CONNECTION');
export interface PublisherDependencies { connect: (urls: string[] | string) => AmqpConnectionManager; }

@Injectable()
export class PaymentEventsPublisher implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PaymentEventsPublisher.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION) private readonly deps: PublisherDependencies,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) return;
    this.connection = this.deps.connect(url);
    const exchange = this.config.get<string>('PAYMENT_EVENTS_EXCHANGE', 'payment.events');
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

  async publish(type: PaymentEventType, payload: PaymentEventPayload): Promise<void> {
    if (!this.channel) return;
    const envelope: PaymentEventEnvelope<PaymentEventPayload> = {
      type, occurredAt: new Date().toISOString(), service: 'payment-service', payload,
    };
    try {
      await this.channel.publish(this.config.get('PAYMENT_EVENTS_EXCHANGE', 'payment.events'), type, envelope, {
        contentType: 'application/json', persistent: true, messageId: `${type}:${payload.bookingId}`,
      });
    } catch (err) {
      this.logger.error(`failed to publish ${type}: ${err}`);
    }
  }
}
