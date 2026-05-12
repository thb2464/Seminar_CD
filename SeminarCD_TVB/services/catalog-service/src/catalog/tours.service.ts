import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { ILike, Repository } from 'typeorm';

import { CatalogEventsPublisher } from '../events/catalog-events.publisher';
import { TourQueryDto } from './dto/tour-query.dto';
import { CreateTourDto, UpdateTourDto } from './dto/tour.dto';
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

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tours: Repository<Tour>,
    private readonly events: CatalogEventsPublisher,
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

  async create(dto: CreateTourDto): Promise<Tour> {
    const documentId = dto.documentId ?? randomUUID();
    const tour = this.tours.create({
      documentId,
      locale: dto.locale,
      slug: dto.slug,
      tourName: dto.tourName,
      shortDescription: dto.shortDescription ?? null,
      description: dto.description ?? null,
      region: dto.region ?? null,
      location: dto.location ?? null,
      departureLocation: dto.departureLocation ?? null,
      price: dto.price ?? null,
      originalPrice: dto.originalPrice ?? null,
      childPrice: dto.childPrice ?? null,
      durationDays: dto.durationDays ?? null,
      durationNights: dto.durationNights ?? null,
      maxParticipants: dto.maxParticipants ?? null,
      rating: dto.rating ?? null,
      reviewCount: dto.reviewCount ?? null,
      transportType: dto.transportType ?? null,
      isFeatured: dto.isFeatured ?? false,
      highlights: dto.highlights ?? [],
      itinerary: dto.itinerary ?? null,
      gallery: dto.gallery ?? [],
      featuredImageUrl: dto.featuredImageUrl ?? null,
      tourCategoryId: dto.tourCategoryId ?? null,
      publishedAt: new Date(),
    });
    const saved = await this.tours.save(tour);
    await this.events.publishTourCreated(saved);
    return saved;
  }

  async update(id: number, dto: UpdateTourDto): Promise<Tour> {
    const tour = await this.findById(id, dto.locale);
    Object.assign(tour, {
      slug: dto.slug ?? tour.slug,
      tourName: dto.tourName ?? tour.tourName,
      shortDescription: dto.shortDescription ?? tour.shortDescription,
      description: dto.description ?? tour.description,
      region: dto.region ?? tour.region,
      location: dto.location ?? tour.location,
      departureLocation: dto.departureLocation ?? tour.departureLocation,
      price: dto.price ?? tour.price,
      originalPrice: dto.originalPrice ?? tour.originalPrice,
      childPrice: dto.childPrice ?? tour.childPrice,
      durationDays: dto.durationDays ?? tour.durationDays,
      durationNights: dto.durationNights ?? tour.durationNights,
      maxParticipants: dto.maxParticipants ?? tour.maxParticipants,
      rating: dto.rating ?? tour.rating,
      reviewCount: dto.reviewCount ?? tour.reviewCount,
      transportType: dto.transportType ?? tour.transportType,
      isFeatured: dto.isFeatured ?? tour.isFeatured,
      highlights: dto.highlights ?? tour.highlights,
      itinerary: dto.itinerary ?? tour.itinerary,
      gallery: dto.gallery ?? tour.gallery,
      featuredImageUrl: dto.featuredImageUrl ?? tour.featuredImageUrl,
      tourCategoryId: dto.tourCategoryId ?? tour.tourCategoryId,
    });
    const saved = await this.tours.save(tour);
    await this.events.publishTourUpdated(saved);
    return saved;
  }

  async softDelete(id: number, locale: SupportedLocale = 'vi'): Promise<Tour> {
    const tour = await this.findById(id, locale);
    await this.tours.softRemove(tour);
    await this.events.publishTourDeleted(tour);
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
