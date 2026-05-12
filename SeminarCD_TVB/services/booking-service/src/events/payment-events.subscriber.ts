import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

import { AMQP_CONNECTION } from './booking-events.publisher';
import type { PublisherDependencies } from './booking-events.publisher';
import { PaymentEventEnvelope, PaymentEventPayload, PAYMENT_COMPLETED, PAYMENT_FAILED } from './payment-event.types';
import { Booking } from '../booking/entities/booking.entity';

@Injectable()
export class PaymentEventsSubscriber implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PaymentEventsSubscriber.name);
  private channel: ChannelWrapper | null = null;
  private connection: AmqpConnectionManager | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION)
    private readonly deps: PublisherDependencies,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL not set — cannot subscribe to payment events');
      return;
    }
    
    this.connection = this.deps.connect(url);
    const exchange = this.config.get<string>('PAYMENT_EVENTS_EXCHANGE', 'payment.events');
    const queueName = 'booking_service_payment_events';

    this.channel = this.connection.createChannel({
      setup: async (ch: import('amqplib').ConfirmChannel) => {
        await ch.assertExchange(exchange, 'topic', { durable: true });
        await ch.assertQueue(queueName, { durable: true });
        
        await ch.bindQueue(queueName, exchange, PAYMENT_COMPLETED);
        await ch.bindQueue(queueName, exchange, PAYMENT_FAILED);

        await ch.consume(queueName, async (msg) => {
          if (!msg) return;
          try {
            const content = msg.content.toString();
            const envelope = JSON.parse(content) as PaymentEventEnvelope<PaymentEventPayload>;
            await this.handleEvent(envelope);
            ch.ack(msg);
          } catch (err) {
            this.logger.error(`Failed to process payment event: ${err instanceof Error ? err.message : String(err)}`);
            ch.reject(msg, false);
          }
        });
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
    }
  }

  private async handleEvent(envelope: PaymentEventEnvelope<PaymentEventPayload>): Promise<void> {
    const { type, payload } = envelope;
    
    const booking = await this.bookingRepo.findOne({ where: { id: payload.bookingId } });
    if (!booking) {
      this.logger.warn(`Received ${type} for unknown booking ID ${payload.bookingId}`);
      return;
    }

    if (type === PAYMENT_COMPLETED) {
      booking.status = 'Paid';
      booking.vnpayTransactionNo = payload.transactionNo || '';
      this.logger.log(`Booking ${booking.id} status updated to Paid`);
    } else if (type === PAYMENT_FAILED) {
      booking.status = 'Failed';
      this.logger.log(`Booking ${booking.id} status updated to Failed`);
    }

    await this.bookingRepo.save(booking);
  }
}
