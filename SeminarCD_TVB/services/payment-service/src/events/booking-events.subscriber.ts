import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

import { AMQP_CONNECTION } from './payment-events.publisher';
import type { PublisherDependencies } from './payment-events.publisher';
import { BookingEventEnvelope, BookingEventPayload, BOOKING_CREATED, BOOKING_CANCELLED } from './booking-event.types';
import { Payment } from '../payment/entities/payment.entity';

@Injectable()
export class BookingEventsSubscriber implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(BookingEventsSubscriber.name);
  private channel: ChannelWrapper | null = null;
  private connection: AmqpConnectionManager | null = null;

  constructor(
    private readonly config: ConfigService,
    @Inject(AMQP_CONNECTION) private readonly deps: PublisherDependencies,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) return;
    this.connection = this.deps.connect(url);
    const exchange = this.config.get<string>('BOOKING_EVENTS_EXCHANGE', 'booking.events');
    const queueName = 'payment_service_booking_events';

    this.channel = this.connection.createChannel({
      setup: async (ch: import('amqplib').ConfirmChannel) => {
        await ch.assertExchange(exchange, 'topic', { durable: true });
        await ch.assertQueue(queueName, { durable: true });
        await ch.bindQueue(queueName, exchange, BOOKING_CREATED);
        await ch.bindQueue(queueName, exchange, BOOKING_CANCELLED);

        await ch.consume(queueName, async (msg) => {
          if (!msg) return;
          try {
            const content = msg.content.toString();
            const envelope = JSON.parse(content) as BookingEventEnvelope<BookingEventPayload>;
            await this.handleEvent(envelope);
            ch.ack(msg);
          } catch (err) {
            this.logger.error(`Failed to process booking event: ${err}`);
            ch.reject(msg, false);
          }
        });
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.channel) await this.channel.close().catch(() => undefined);
  }

  private async handleEvent(envelope: BookingEventEnvelope<BookingEventPayload>): Promise<void> {
    const { type, payload } = envelope;
    
    if (type === BOOKING_CREATED) {
      let payment = await this.paymentRepo.findOne({ where: { bookingId: payload.id } });
      if (!payment) {
        payment = this.paymentRepo.create({
          bookingId: payload.id,
          userId: payload.userId,
          amount: payload.totalPrice,
          status: payload.status,
          paymentRef: payload.paymentRef,
        });
        await this.paymentRepo.save(payment);
        this.logger.log(`Created payment replica for booking ${payload.id}`);
      }
    } else if (type === BOOKING_CANCELLED) {
      let payment = await this.paymentRepo.findOne({ where: { bookingId: payload.id } });
      if (payment) {
        payment.status = 'Cancelled';
        await this.paymentRepo.save(payment);
      }
    }
  }
}
