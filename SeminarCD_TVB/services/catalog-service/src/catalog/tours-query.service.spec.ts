import { NotFoundException } from '@nestjs/common';

import { Tour } from './entities/tour.entity';
import { ToursQueryService } from './tours-query.service';

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
      region: 'MienTrung',
      isFeatured: true,
      highlights: [],
      gallery: [],
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Tour,
    partial,
  );
  return tour;
}

function buildRepo() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };
}

describe('ToursQueryService (read side)', () => {
  it('list returns Strapi-style envelope with pagination meta', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[makeTour()], 47]);
    const service = new ToursQueryService(repo as any);

    const result = await service.list({
      locale: 'vi',
      pagination: { page: 2, pageSize: 10 },
    } as any);

    expect(result.data).toHaveLength(1);
    expect(result.meta.pagination).toEqual({ page: 2, pageSize: 10, pageCount: 5, total: 47 });
    expect(repo.findAndCount.mock.calls[0][0].take).toBe(10);
    expect(repo.findAndCount.mock.calls[0][0].skip).toBe(10);
  });

  it('list applies filters into the where clause', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursQueryService(repo as any);

    await service.list({
      locale: 'en',
      filters: { region: 'MienBac', isFeatured: true, categoryId: 7 },
    } as any);
    expect(repo.findAndCount.mock.calls[0][0].where).toMatchObject({
      locale: 'en',
      region: 'MienBac',
      isFeatured: true,
      tourCategoryId: 7,
    });
  });

  it('list defaults sort to createdAt DESC, accepts whitelisted overrides', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursQueryService(repo as any);
    await service.list({ locale: 'vi' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ createdAt: 'DESC' });

    repo.findAndCount.mockClear();
    await service.list({ locale: 'vi', sort: 'price:asc' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ price: 'ASC' });
  });

  it('list ignores non-whitelisted sort fields', async () => {
    const repo = buildRepo();
    repo.findAndCount.mockResolvedValue([[], 0]);
    const service = new ToursQueryService(repo as any);
    await service.list({ locale: 'vi', sort: 'password:desc' } as any);
    expect(repo.findAndCount.mock.calls[0][0].order).toEqual({ createdAt: 'DESC' });
  });

  it('findById raises NotFound when missing', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const service = new ToursQueryService(repo as any);
    await expect(service.findById(99, 'vi')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findBySlug locates by slug + locale', async () => {
    const repo = buildRepo();
    const tour = makeTour({ slug: 'hue-tour', locale: 'en' });
    repo.findOne.mockResolvedValue(tour);
    const service = new ToursQueryService(repo as any);
    const found = await service.findBySlug('hue-tour', 'en');
    expect(found).toBe(tour);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'hue-tour', locale: 'en' } });
  });
});
