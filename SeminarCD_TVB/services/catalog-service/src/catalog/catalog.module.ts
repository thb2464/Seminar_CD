import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tour } from './entities/tour.entity';
import { TourCategory } from './entities/tour-category.entity';
import { TourCategoriesController } from './tour-categories.controller';
import { TourCategoriesService } from './tour-categories.service';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tour, TourCategory])],
  controllers: [ToursController, TourCategoriesController],
  providers: [ToursService, TourCategoriesService],
  exports: [ToursService, TourCategoriesService],
})
export class CatalogModule {}
