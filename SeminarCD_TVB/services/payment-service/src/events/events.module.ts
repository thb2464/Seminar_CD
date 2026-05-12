import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as amqp from 'amqp-connection-manager';
import { PaymentEventsPublisher, AMQP_CONNECTION } from './payment-events.publisher';
import { BookingEventsSubscriber } from './booking-events.subscriber';
import { Payment } from '../payment/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [
    {
      provide: AMQP_CONNECTION,
      useValue: { connect: amqp.connect },
    },
    PaymentEventsPublisher,
    BookingEventsSubscriber,
  ],
  exports: [PaymentEventsPublisher, AMQP_CONNECTION],
})
export class EventsModule {}
