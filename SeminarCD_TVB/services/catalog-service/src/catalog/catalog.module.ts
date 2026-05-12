import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsModule } from '../events/events.module';
import { Tour } from './entities/tour.entity';
import { TourCategory } from './entities/tour-category.entity';
import { TourCategoriesController } from './tour-categories.controller';
import { TourCategoriesService } from './tour-categories.service';
import { ToursController } from './tours.controller';
import { ToursQueryService } from './tours-query.service';
import { ToursService } from './tours.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tour, TourCategory]), EventsModule],
  controllers: [ToursController, TourCategoriesController],
  providers: [ToursQueryService, ToursService, TourCategoriesService],
  exports: [ToursQueryService, ToursService, TourCategoriesService],
})
export class CatalogModule {}
