import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { CatalogEventsPublisher } from '../events/catalog-events.publisher';
import { CreateTourDto, UpdateTourDto } from './dto/tour.dto';
import { SupportedLocale } from './entities/tour-category.entity';
import { Tour } from './entities/tour.entity';

/**
 * Command side of the CQRS split for the catalog (reads live in
 * `ToursQueryService`). Every mutation also publishes a `catalog.events`
 * envelope so the AI chatbot's vector store stays in sync (F3.5 / F3.6).
 */
@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tours: Repository<Tour>,
    private readonly events: CatalogEventsPublisher,
  ) {}

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
    const tour = await this.tours.findOne({ where: { id, locale: dto.locale } });
    if (!tour) {
      throw new NotFoundException(`Tour ${id} not found in locale ${dto.locale}`);
    }
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
    const tour = await this.tours.findOne({ where: { id, locale } });
    if (!tour) {
      throw new NotFoundException(`Tour ${id} not found in locale ${locale}`);
    }
    await this.tours.softRemove(tour);
    await this.events.publishTourDeleted(tour);
    return tour;
  }
}
