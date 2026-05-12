import { NotFoundException } from '@nestjs/common';

import { Tour } from './entities/tour.entity';
import { ToursService } from './tours.service';

function makeTour(partial: Partial<Tour> = {}): Tour {
  const tour = new Tour();
  Object.assign(
    tour,
    {
      id: 1,
      documentId: 'doc-1',
      locale: 'vi',
      slug: 'hue-tour',
      tourName: 'Hue Tour',
      shortDescription: null,
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
      highlights: [],
      itinerary: null,
      gallery: [],
      featuredImageUrl: null,
      tourCategoryId: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as Tour,
    partial,
  );
  return tour;
}

function buildRepo() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((value: unknown) => value as Tour),
    save: jest.fn(async (value: unknown) => value as Tour),
    softRemove: jest.fn(async (value: unknown) => value as Tour),
  };
}

describe('ToursService', () => {
  it('list returns Strapi-style envelope with pagination meta', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[makeTour()], 47]);
    const service = new ToursService(repo as any);

    const result = await service.list({
      locale: 'vi',
      pagination: { page: 2, pageSize: 10 },
    } as any);

    expect(result.data).toHaveLength(1);
    expect(result.meta.pagination).toEqual({
      page: 2,
      pageSize: 10,
      pageCount: 5,
      total: 47,
    });
    const [options] = repo.findAndCount.mock.calls[0];
    expect(options.where).toMatchObject({ locale: 'vi' });
    expect(options.take).toBe(10);
    expect(options.skip).toBe(10);
  });

  it('list applies filters into the where clause', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursService(repo as any);

    await service.list({
      locale: 'en',
      filters: { region: 'MienBac', isFeatured: true, categoryId: 7 },
    } as any);
    const [options] = repo.findAndCount.mock.calls[0];
    expect(options.where).toMatchObject({
      locale: 'en',
      region: 'MienBac',
      isFeatured: true,
      tourCategoryId: 7,
    });
  });

  it('list defaults sort to createdAt DESC, accepts whitelisted overrides', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursService(repo as any);
    await service.list({ locale: 'vi' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ createdAt: 'DESC' });

    repo.findAndCount.mockClear();
    await service.list({ locale: 'vi', sort: 'price:asc' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ price: 'ASC' });
  });

  it('list ignores non-whitelisted sort fields', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursService(repo as any);
    await service.list({ locale: 'vi', sort: 'password:desc' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ createdAt: 'DESC' });
  });

  it('findById raises NotFound when missing', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const service = new ToursService(repo as any);
    await expect(service.findById(99, 'vi')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findBySlug locates by slug + locale', async () => {
    const repo = buildRepo();
    const tour = makeTour({ slug: 'hue-tour', locale: 'en' });
    repo.findOne.mockResolvedValue(tour);
    const service = new ToursService(repo as any);

    const found = await service.findBySlug('hue-tour', 'en');
    expect(found).toBe(tour);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'hue-tour', locale: 'en' } });
  });

  it('create persists with sensible defaults, assigning documentId if absent', async () => {
    const repo = buildRepo();
    const service = new ToursService(repo as any);
    const tour = await service.create({
      locale: 'vi',
      slug: 'new-tour',
      tourName: 'New Tour',
    } as any);
    expect(tour.documentId).toBeDefined();
    expect(tour.documentId).not.toBe('');
    expect(tour.highlights).toEqual([]);
    expect(tour.gallery).toEqual([]);
    expect(tour.isFeatured).toBe(false);
  });

  it('update merges only provided fields', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(makeTour({ tourName: 'Old', price: 1000 }));
    const service = new ToursService(repo as any);

    const updated = await service.update(1, { tourName: 'New', locale: 'vi' } as any);
    expect(updated.tourName).toBe('New');
    expect(updated.price).toBe(1000);
  });

  it('softDelete calls softRemove on the matched row', async () => {
    const repo = buildRepo();
    const tour = makeTour();
    repo.findOne.mockResolvedValue(tour);
    const service = new ToursService(repo as any);
    await service.softDelete(1, 'vi');
    expect(repo.softRemove).toHaveBeenCalledWith(tour);
  });
});
