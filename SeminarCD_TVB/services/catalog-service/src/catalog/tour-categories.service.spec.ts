import { NotFoundException } from '@nestjs/common';

import { TourCategory } from './entities/tour-category.entity';
import { TourCategoriesService } from './tour-categories.service';

function buildRepo() {
  return {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };
}

describe('TourCategoriesService', () => {
  it('list returns Strapi-style envelope', async () => {
    const repo = buildRepo();
    const cat = new TourCategory();
    cat.id = 1;
    cat.name = 'Miền Trung';
    cat.slug = 'mien-trung';
    cat.locale = 'vi';
    repo.findAndCount.mockResolvedValue([[cat], 1]);
    const service = new TourCategoriesService(repo as any);

    const result = await service.list('vi', 1, 25);
    expect(result.data).toHaveLength(1);
    expect(result.meta.pagination.total).toBe(1);
    expect(result.meta.pagination.pageCount).toBe(1);
  });

  it('findById raises NotFound when missing', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const service = new TourCategoriesService(repo as any);
    await expect(service.findById(99, 'vi')).rejects.toBeInstanceOf(NotFoundException);
  });
});
