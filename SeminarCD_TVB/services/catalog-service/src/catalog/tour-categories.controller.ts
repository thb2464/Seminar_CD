import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { TourCategory, SupportedLocale } from './entities/tour-category.entity';
import {
  PaginatedTourCategories,
  TourCategoriesService,
} from './tour-categories.service';

@Controller('tour-categories')
export class TourCategoriesController {
  constructor(private readonly categories: TourCategoriesService) {}

  @Get()
  list(
    @Query('locale') locale: SupportedLocale = 'vi',
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize = 25,
  ): Promise<PaginatedTourCategories> {
    return this.categories.list(locale, page, pageSize);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('locale') locale: SupportedLocale = 'vi',
  ): Promise<TourCategory> {
    return this.categories.findById(id, locale);
  }
}
