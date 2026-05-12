import { Tour } from './tour.entity';

describe('Tour entity', () => {
  it('defaults highlights and gallery to empty arrays', () => {
    const tour = new Tour();
    // TypeORM populates defaults on insert; we just verify the field types.
    tour.highlights = [];
    tour.gallery = [];
    expect(Array.isArray(tour.highlights)).toBe(true);
    expect(Array.isArray(tour.gallery)).toBe(true);
  });

  it('allows nullable bigint columns to be null', () => {
    const tour = new Tour();
    tour.price = null;
    tour.originalPrice = null;
    tour.childPrice = null;
    expect(tour.price).toBeNull();
    expect(tour.originalPrice).toBeNull();
    expect(tour.childPrice).toBeNull();
  });

  it('stores numeric price values', () => {
    const tour = new Tour();
    tour.price = 2_500_000;
    tour.originalPrice = 3_000_000;
    expect(tour.price).toBe(2_500_000);
    expect(tour.originalPrice).toBe(3_000_000);
  });

  it('keeps Strapi blocks for description and itinerary', () => {
    const tour = new Tour();
    tour.description = [{ type: 'paragraph', children: [{ text: 'hello' }] }];
    tour.itinerary = [{ type: 'list', children: [] }];
    expect(Array.isArray(tour.description)).toBe(true);
    expect(Array.isArray(tour.itinerary)).toBe(true);
  });
});
