import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminOnlyGuard } from './admin-only.guard';
import { TourQueryDto } from './dto/tour-query.dto';
import { CreateTourDto, UpdateTourDto } from './dto/tour.dto';
import { SupportedLocale } from './entities/tour-category.entity';
import { Tour } from './entities/tour.entity';
import { PaginatedTours, ToursQueryService } from './tours-query.service';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursQuery: ToursQueryService,
    private readonly tours: ToursService,
  ) {}

  @Get()
  list(@Query() query: TourQueryDto): Promise<PaginatedTours> {
    return this.toursQuery.list(query);
  }

  @Get('slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale: SupportedLocale = 'vi',
  ): Promise<Tour> {
    return this.toursQuery.findBySlug(slug, locale);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('locale') locale: SupportedLocale = 'vi',
  ): Promise<Tour> {
    return this.toursQuery.findById(id, locale);
  }

  @UseGuards(AdminOnlyGuard)
  @Post()
  create(@Body() dto: CreateTourDto): Promise<Tour> {
    return this.tours.create(dto);
  }

  @UseGuards(AdminOnlyGuard)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTourDto): Promise<Tour> {
    return this.tours.update(id, dto);
  }

  @UseGuards(AdminOnlyGuard)
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('locale') locale: SupportedLocale = 'vi',
  ): Promise<void> {
    await this.tours.softDelete(id, locale);
  }
}
