import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as amqp from 'amqp-connection-manager';
import { BookingEventsPublisher, AMQP_CONNECTION } from './booking-events.publisher';
import { PaymentEventsSubscriber } from './payment-events.subscriber';
import { Booking } from '../booking/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  providers: [
    {
      provide: AMQP_CONNECTION,
      useValue: {
        connect: amqp.connect,
      },
    },
    BookingEventsPublisher,
    PaymentEventsSubscriber,
  ],
  exports: [BookingEventsPublisher, AMQP_CONNECTION],
})
export class EventsModule {}
