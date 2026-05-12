import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';

import { AMQP_CONNECTION, CatalogEventsPublisher } from './catalog-events.publisher';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AMQP_CONNECTION,
      useValue: { connect: amqp.connect },
    },
    CatalogEventsPublisher,
  ],
  exports: [CatalogEventsPublisher],
})
export class EventsModule {}
