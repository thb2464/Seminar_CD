import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { TourQueryDto } from './dto/tour-query.dto';
import { SupportedLocale } from './entities/tour-category.entity';
import { Tour } from './entities/tour.entity';

export interface PaginatedTours {
  data: Tour[];
  meta: {
    pagination: { page: number; pageSize: number; pageCount: number; total: number };
  };
}

const SORT_WHITELIST = new Set<keyof Tour>([
  'createdAt',
  'updatedAt',
  'publishedAt',
  'price',
  'rating',
  'tourName',
  'reviewCount',
]);

/**
 * Read-only side of the CQRS split for the catalog.
 *
 * Lives separately from {@link import('./tours.service').ToursService} so that:
 * - reads can be cached / replicated independently (Phase 6 D4 introduces an
 *   HPA scaling the catalog 2–5 replicas; the read service can scale further);
 * - writes (which also publish RabbitMQ events) stay narrowly scoped.
 *
 * The two services share the same `tours` table for now — full CQRS with a
 * separate read-model materialised view is a later optimisation.
 */
@Injectable()
export class ToursQueryService {
  constructor(
    @InjectRepository(Tour)
    private readonly tours: Repository<Tour>,
  ) {}

  async list(query: TourQueryDto): Promise<PaginatedTours> {
    const page = query.pagination?.page ?? 1;
    const pageSize = query.pagination?.pageSize ?? 25;
    const where = this.buildWhere(query);
    const order = this.buildOrder(query.sort);

    const [data, total] = await this.tours.findAndCount({
      where,
      order,
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

  async findById(id: number, _locale: SupportedLocale = 'vi'): Promise<Tour> {
    // id is the PK and unique on its own. The locale param is accepted for
    // backwards compatibility with the controller signature but ignored so a
    // tour can be fetched from any of its localised rows.
    const tour = await this.tours.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour ${id} not found`);
    }
    return tour;
  }

  async findBySlug(slug: string, locale: SupportedLocale = 'vi'): Promise<Tour> {
    const tour = await this.tours.findOne({ where: { slug, locale } });
    if (!tour) {
      throw new NotFoundException(`Tour with slug "${slug}" not found in locale ${locale}`);
    }
    return tour;
  }

  private buildWhere(query: TourQueryDto): Record<string, unknown> {
    const where: Record<string, unknown> = { locale: query.locale };
    const filters = query.filters;
    if (filters?.region) where.region = filters.region;
    if (filters?.slug) where.slug = filters.slug;
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters?.categoryId !== undefined) where.tourCategoryId = filters.categoryId;
    if (filters?.search) where.tourName = ILike(`%${filters.search}%`);
    return where;
  }

  private buildOrder(sortString?: string): Record<string, 'ASC' | 'DESC'> {
    if (!sortString) return { createdAt: 'DESC' };
    const [rawField, rawDir] = sortString.split(':');
    if (!rawField || !SORT_WHITELIST.has(rawField as keyof Tour)) {
      return { createdAt: 'DESC' };
    }
    const dir = (rawDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    return { [rawField]: dir };
  }
}
