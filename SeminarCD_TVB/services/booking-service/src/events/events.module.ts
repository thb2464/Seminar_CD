import { Module } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { BookingEventsPublisher, AMQP_CONNECTION } from './booking-events.publisher';

@Module({
  providers: [
    {
      provide: AMQP_CONNECTION,
      useValue: {
        connect: amqp.connect,
      },
    },
    BookingEventsPublisher,
  ],
  exports: [BookingEventsPublisher, AMQP_CONNECTION],
})
export class EventsModule {}
