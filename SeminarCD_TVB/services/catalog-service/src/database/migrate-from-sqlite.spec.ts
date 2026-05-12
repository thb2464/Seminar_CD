import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import Database from 'better-sqlite3';

import { Tour } from '../catalog/entities/tour.entity';
import { TourCategory } from '../catalog/entities/tour-category.entity';
import { AppDataSource } from './data-source';
import { migrateCatalogFromSqlite } from './migrate-from-sqlite';

function makeFixtureDb(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-mig-'));
  const filePath = path.join(tmp, 'data.db');
  const db = new Database(filePath);
  db.exec(`
    CREATE TABLE tour_categories (
      id INTEGER PRIMARY KEY,
      document_id TEXT,
      locale TEXT,
      slug TEXT,
      name TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT,
      published_at TEXT
    );
    CREATE TABLE tours (
      id INTEGER PRIMARY KEY,
      document_id TEXT,
      locale TEXT,
      slug TEXT,
      Tour_Name TEXT,
      Short_Description TEXT,
      Description TEXT,
      Region TEXT,
      Location TEXT,
      Departure_Location TEXT,
      Price INTEGER,
      Original_Price INTEGER,
      Child_Price INTEGER,
      Duration_Days INTEGER,
      Duration_Nights INTEGER,
      Max_Participants INTEGER,
      Rating REAL,
      Review_Count INTEGER,
      Transport_Type TEXT,
      Is_Featured INTEGER,
      Itinerary TEXT,
      tour_category_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      published_at TEXT
    );
    INSERT INTO tour_categories
      (id, document_id, locale, slug, name, description, created_at, updated_at, published_at)
    VALUES
      (1, 'cat-doc-1', 'vi', 'mien-trung', 'Miền Trung', 'Vùng giữa', '2025-12-01', '2025-12-02', '2025-12-02');
    INSERT INTO tours
      (id, document_id, locale, slug, Tour_Name, Short_Description, Description, Region, Location,
       Departure_Location, Price, Original_Price, Child_Price, Duration_Days, Duration_Nights,
       Max_Participants, Rating, Review_Count, Transport_Type, Is_Featured, Itinerary,
       tour_category_id, created_at, updated_at, published_at)
    VALUES
      (10, 'tour-doc-10', 'vi', 'hue-tour', 'Hue Tour', 'Walk the citadel', '[{"type":"paragraph"}]',
       'MienTrung', 'Hue', 'Da Nang', 2500000, 3000000, 1500000, 3, 2, 20, 4.8, 12, 'XeKhach', 1,
       '[{"type":"paragraph","children":[{"text":"Day 1"}]}]', 1, '2025-12-01', '2025-12-02',
       '2025-12-02');
  `);
  db.close();
  return filePath;
}

describe('migrateCatalogFromSqlite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('propagates DataSource initialisation failure', async () => {
    const fixture = makeFixtureDb();
    jest.spyOn(AppDataSource, 'initialize').mockRejectedValueOnce(new Error('postgres down'));
    await expect(migrateCatalogFromSqlite(fixture)).rejects.toThrow('postgres down');
  });

  it('inserts categories and tours, aligning sequences', async () => {
    const fixture = makeFixtureDb();
    const catRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const tourRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(AppDataSource, 'isInitialized', 'get').mockReturnValue(true);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockImplementation((entity) =>
        (entity === TourCategory ? catRepo : tourRepo) as ReturnType<
          typeof AppDataSource.getRepository
        >,
      );
    const querySpy = jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);
    jest.spyOn(AppDataSource, 'destroy').mockResolvedValue();

    const result = await migrateCatalogFromSqlite(fixture);

    expect(result.categories.read).toBe(1);
    expect(result.categories.inserted).toBe(1);
    expect(result.tours.read).toBe(1);
    expect(result.tours.inserted).toBe(1);
    expect(result.errors).toEqual([]);

    const catInsert = catRepo.insert.mock.calls[0][0] as Partial<TourCategory>;
    expect(catInsert.id).toBe(1);
    expect(catInsert.documentId).toBe('cat-doc-1');
    expect(catInsert.slug).toBe('mien-trung');

    const tourInsert = tourRepo.insert.mock.calls[0][0] as Partial<Tour>;
    expect(tourInsert.id).toBe(10);
    expect(tourInsert.tourName).toBe('Hue Tour');
    expect(tourInsert.price).toBe(2_500_000);
    expect(tourInsert.region).toBe('MienTrung');
    expect(tourInsert.isFeatured).toBe(true);
    expect(tourInsert.description).toEqual([{ type: 'paragraph' }]);
    expect(tourInsert.itinerary).toEqual([
      { type: 'paragraph', children: [{ text: 'Day 1' }] },
    ]);

    // Sequence alignment ran once per table.
    expect(querySpy).toHaveBeenCalledWith(expect.any(String), ['tour_categories', 1]);
    expect(querySpy).toHaveBeenCalledWith(expect.any(String), ['tours', 10]);
  });

  it('skips already-migrated rows', async () => {
    const fixture = makeFixtureDb();
    const catRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 } as TourCategory),
      insert: jest.fn(),
    };
    const tourRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 10 } as Tour),
      insert: jest.fn(),
    };

    jest.spyOn(AppDataSource, 'isInitialized', 'get').mockReturnValue(true);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockImplementation((entity) =>
        (entity === TourCategory ? catRepo : tourRepo) as ReturnType<
          typeof AppDataSource.getRepository
        >,
      );
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);
    jest.spyOn(AppDataSource, 'destroy').mockResolvedValue();

    const result = await migrateCatalogFromSqlite(fixture);
    expect(result.categories.inserted).toBe(0);
    expect(result.categories.skipped).toBe(1);
    expect(result.tours.inserted).toBe(0);
    expect(result.tours.skipped).toBe(1);
    expect(catRepo.insert).not.toHaveBeenCalled();
    expect(tourRepo.insert).not.toHaveBeenCalled();
  });
});
