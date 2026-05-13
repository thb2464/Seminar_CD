import { NotFoundException } from '@nestjs/common';

import { Tour } from './entities/tour.entity';
import { ToursService } from './tours.service';

function makeEvents() {
  return {
    publishTourCreated: jest.fn().mockResolvedValue(undefined),
    publishTourUpdated: jest.fn().mockResolvedValue(undefined),
    publishTourDeleted: jest.fn().mockResolvedValue(undefined),
  } as any;
}

function buildRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value as Tour),
    save: jest.fn(async (value: unknown) => value as Tour),
    softRemove: jest.fn(async (value: unknown) => value as Tour),
  };
}

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
    } as unknown as Tour,
    partial,
  );
  return tour;
}

describe('ToursService (write side)', () => {
  it('create persists, emits TourCreated, and stamps UUID documentId', async () => {
    const repo = buildRepo();
    const events = makeEvents();
    const service = new ToursService(repo as any, events);
    const saved = await service.create({
      locale: 'vi',
      slug: 'new-tour',
      tourName: 'New Tour',
    } as any);
    expect(saved.documentId).toBeDefined();
    expect(saved.documentId).not.toBe('');
    expect(saved.isFeatured).toBe(false);
    expect(events.publishTourCreated).toHaveBeenCalledTimes(1);
  });

  it('update merges only provided fields and emits TourUpdated', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(makeTour({ tourName: 'Old', price: 1000 }));
    const events = makeEvents();
    const service = new ToursService(repo as any, events);
    const updated = await service.update(1, { locale: 'vi', tourName: 'New' } as any);
    expect(updated.tourName).toBe('New');
    expect(updated.price).toBe(1000);
    expect(events.publishTourUpdated).toHaveBeenCalledWith(updated);
  });

  it('update raises NotFound and skips emit when missing', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const events = makeEvents();
    const service = new ToursService(repo as any, events);
    await expect(service.update(99, { locale: 'vi' } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(events.publishTourUpdated).not.toHaveBeenCalled();
  });

  it('softDelete soft-removes and emits TourDeleted', async () => {
    const repo = buildRepo();
    const tour = makeTour();
    repo.findOne.mockResolvedValue(tour);
    const events = makeEvents();
    const service = new ToursService(repo as any, events);
    await service.softDelete(1, 'vi');
    expect(repo.softRemove).toHaveBeenCalledWith(tour);
    expect(events.publishTourDeleted).toHaveBeenCalledWith(tour);
  });

  it('softDelete raises NotFound when missing', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const events = makeEvents();
    const service = new ToursService(repo as any, events);
    await expect(service.softDelete(99, 'vi')).rejects.toBeInstanceOf(NotFoundException);
    expect(events.publishTourDeleted).not.toHaveBeenCalled();
  });
});
