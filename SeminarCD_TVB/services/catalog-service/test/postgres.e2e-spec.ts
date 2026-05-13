import { TourCategory } from '../src/catalog/entities/tour-category.entity';
import { Tour } from '../src/catalog/entities/tour.entity';
import {
  PostgresTestEnvironment,
  startPostgresTestEnvironment,
} from './postgres-testcontainer';

describe('PostgreSQL testcontainer', () => {
  let postgres: PostgresTestEnvironment | undefined;

  beforeAll(async () => {
    postgres = await startPostgresTestEnvironment({
      database: 'catalog_test',
      username: 'catalog',
      password: 'catalog',
      entities: [Tour, TourCategory],
    });
  }, 120_000);

  afterAll(async () => {
    await postgres?.stop();
  }, 120_000);

  it('initializes TypeORM against an isolated PostgreSQL database', async () => {
    if (!postgres) {
      throw new Error('PostgreSQL test environment was not initialized');
    }

    const rows = (await postgres.dataSource.query(
      'SELECT current_database() AS database',
    )) as Array<{ database: string }>;

    expect(rows).toEqual([{ database: 'catalog_test' }]);
    expect(postgres.dataSource.getMetadata(Tour).tableName).toBe('tours');
    expect(postgres.dataSource.getMetadata(TourCategory).tableName).toBe('tour_categories');
  });
});
