import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

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

const SORT_ALIASES: Record<string, keyof Tour> = {
  Tour_Name: 'tourName',
  Price: 'price',
  Rating: 'rating',
  Review_Count: 'reviewCount',
};

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

  async findById(id: number, locale: SupportedLocale = 'vi'): Promise<Tour> {
    const tour = await this.tours.findOne({ where: { id, locale } });
    if (!tour) {
      throw new NotFoundException(`Tour ${id} not found in locale ${locale}`);
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
    const slug = stringValue(readEq(filters?.slug));
    if (slug) where.slug = slug;
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    const categoryId = filters?.categoryId ?? numberValue(readEq(filters?.tour_category?.id));
    if (categoryId !== undefined) where.tourCategoryId = categoryId;
    const search = filters?.search ?? stringValue(filters?.Tour_Name?.$containsi);
    if (search) where.tourName = ILike(`%${search}%`);
    const minPrice = numberValue(filters?.Price?.$gte);
    const maxPrice = numberValue(filters?.Price?.$lte);
    if (minPrice !== undefined && maxPrice !== undefined) where.price = Between(minPrice, maxPrice);
    else if (minPrice !== undefined) where.price = MoreThanOrEqual(minPrice);
    else if (maxPrice !== undefined) where.price = LessThanOrEqual(maxPrice);
    return where;
  }

  private buildOrder(sortString?: string): Record<string, 'ASC' | 'DESC'> {
    if (!sortString) return { createdAt: 'DESC' };
    const [rawField, rawDir] = sortString.split(':');
    const field = rawField ? SORT_ALIASES[rawField] ?? rawField : undefined;
    if (!field || !SORT_WHITELIST.has(field as keyof Tour)) {
      return { createdAt: 'DESC' };
    }
    const dir = (rawDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    return { [field]: dir };
  }
}

function readEq(value: unknown): unknown {
  if (value && typeof value === 'object' && '$eq' in value) {
    return (value as { $eq?: unknown }).$eq;
  }
  return value;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
