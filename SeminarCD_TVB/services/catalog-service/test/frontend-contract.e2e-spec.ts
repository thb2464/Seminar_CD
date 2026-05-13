import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { AdminOnlyGuard } from '../src/catalog/admin-only.guard';
import { TourCategoriesController } from '../src/catalog/tour-categories.controller';
import { TourCategoriesService } from '../src/catalog/tour-categories.service';
import { ToursQueryService } from '../src/catalog/tours-query.service';
import { ToursController } from '../src/catalog/tours.controller';
import { ToursService } from '../src/catalog/tours.service';
import { TourCategory } from '../src/catalog/entities/tour-category.entity';
import { Tour } from '../src/catalog/entities/tour.entity';
import { CatalogEventsPublisher } from '../src/events/catalog-events.publisher';

function makeTour(overrides: Partial<Tour> = {}): Tour {
  const tour = new Tour();
  Object.assign(tour, {
    id: 1,
    documentId: 'doc-1',
    locale: 'vi',
    slug: 'hue-tour',
    tourName: 'Hue Tour',
    shortDescription: 'Citadels and lanterns',
    description: null,
    region: 'MienTrung',
    location: 'Hue',
    departureLocation: 'Da Nang',
    price: 2_500_000,
    originalPrice: null,
    childPrice: null,
    durationDays: 3,
    durationNights: 2,
    maxParticipants: 20,
    rating: 4.8,
    reviewCount: 12,
    transportType: 'XeKhach',
    isFeatured: true,
    highlights: [{ title: 'Citadel' }],
    itinerary: null,
    gallery: [],
    featuredImageUrl: null,
    tourCategoryId: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Tour, overrides);
  return tour;
}

describe('Frontend contract (Tours.jsx / TourDetail.jsx)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const tour = makeTour();

    const tourRepoMock = {
      findAndCount: jest.fn().mockResolvedValue([[tour], 1]),
      findOne: jest.fn(async ({ where }: { where: any }) => {
        if (where.slug === 'hue-tour' && where.locale === 'vi') return tour;
        if (where.id === 1 && where.locale === 'vi') return tour;
        return null;
      }),
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: any) => value),
      softRemove: jest.fn(async () => undefined),
    };

    const categoryRepoMock = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const eventsMock = {
      publishTourCreated: jest.fn().mockResolvedValue(undefined),
      publishTourUpdated: jest.fn().mockResolvedValue(undefined),
      publishTourDeleted: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ToursController, TourCategoriesController],
      providers: [
        ToursQueryService,
        ToursService,
        TourCategoriesService,
        AdminOnlyGuard,
        { provide: getRepositoryToken(Tour), useValue: tourRepoMock },
        { provide: getRepositoryToken(TourCategory), useValue: categoryRepoMock },
        { provide: CatalogEventsPublisher, useValue: eventsMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tours?locale=vi returns { data, meta.pagination }', async () => {
    const response = await request(app.getHttpServer()).get('/api/tours?locale=vi').expect(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta.pagination');
    expect(response.body.meta.pagination).toEqual({
      page: 1,
      pageSize: 25,
      pageCount: 1,
      total: 1,
    });
    const first = response.body.data[0];
    expect(first.tourName).toBe('Hue Tour');
    expect(first.slug).toBe('hue-tour');
  });

  it('GET /api/tours/slug/:slug returns a single tour', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/tours/slug/hue-tour?locale=vi')
      .expect(200);
    expect(response.body.slug).toBe('hue-tour');
    expect(response.body.tourName).toBe('Hue Tour');
    expect(response.body.locale).toBe('vi');
  });

  it('GET /api/tours/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer()).get('/api/tours/999?locale=vi').expect(404);
  });

  it('POST /api/tours without X-User-Id returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .send({ locale: 'vi', slug: 'new', tourName: 'X' })
      .expect(401);
  });

  it('POST /api/tours with non-admin role returns 403', async () => {
    await request(app.getHttpServer())
      .post('/api/tours')
      .set('X-User-Id', '1')
      .set('X-User-Role', 'authenticated')
      .send({ locale: 'vi', slug: 'new', tourName: 'X' })
      .expect(403);
  });

  it('POST /api/tours as admin returns 201 with created tour', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/tours')
      .set('X-User-Id', '1')
      .set('X-User-Role', 'admin')
      .send({ locale: 'vi', slug: 'new-tour', tourName: 'Brand New Tour' })
      .expect(201);
    expect(response.body.tourName).toBe('Brand New Tour');
    expect(response.body.documentId).toBeDefined();
  });
});
