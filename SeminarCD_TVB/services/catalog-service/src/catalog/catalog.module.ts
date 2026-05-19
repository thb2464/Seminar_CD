import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsModule } from '../events/events.module';
import { Tour } from './entities/tour.entity';
import { ToursController } from './tours.controller';
import { ToursQueryService } from './tours-query.service';
import { ToursService } from './tours.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tour]), EventsModule],
  controllers: [ToursController],
  providers: [ToursQueryService, ToursService],
  exports: [ToursQueryService, ToursService],
})
export class CatalogModule {}
