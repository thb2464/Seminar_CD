import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SupportedLocale, TourCategory } from './entities/tour-category.entity';

export interface PaginatedTourCategories {
  data: TourCategory[];
  meta: {
    pagination: { page: number; pageSize: number; pageCount: number; total: number };
  };
}

@Injectable()
export class TourCategoriesService {
  constructor(
    @InjectRepository(TourCategory)
    private readonly repo: Repository<TourCategory>,
  ) {}

  async list(
    locale: SupportedLocale = 'vi',
    page = 1,
    pageSize = 25,
  ): Promise<PaginatedTourCategories> {
    const [data, total] = await this.repo.findAndCount({
      where: { locale },
      order: { name: 'ASC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return {
      data,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: pageSize === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize)),
          total,
        },
      },
    };
  }

  async findById(id: number, locale: SupportedLocale = 'vi'): Promise<TourCategory> {
    const cat = await this.repo.findOne({ where: { id, locale } });
    if (!cat) {
      throw new NotFoundException(`TourCategory ${id} not found in locale ${locale}`);
    }
    return cat;
  }
}
