import { TourCategory } from './tour-category.entity';

describe('TourCategory entity', () => {
  it('holds locale + document_id + slug for grouped translations', () => {
    const cat = new TourCategory();
    cat.documentId = 'cat-1';
    cat.locale = 'vi';
    cat.slug = 'mien-trung';
    cat.name = 'Miền Trung';
    expect(cat.documentId).toBe('cat-1');
    expect(cat.locale).toBe('vi');
    expect(cat.slug).toBe('mien-trung');
    expect(cat.name).toBe('Miền Trung');
  });
});
