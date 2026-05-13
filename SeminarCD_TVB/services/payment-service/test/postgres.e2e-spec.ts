import { Payment } from '../src/payment/entities/payment.entity';
import {
  PostgresTestEnvironment,
  startPostgresTestEnvironment,
} from './postgres-testcontainer';

describe('PostgreSQL testcontainer', () => {
  let postgres: PostgresTestEnvironment | undefined;

  beforeAll(async () => {
    postgres = await startPostgresTestEnvironment({
      database: 'payment_test',
      username: 'payment',
      password: 'payment',
      entities: [Payment],
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

    expect(rows).toEqual([{ database: 'payment_test' }]);
    expect(postgres.dataSource.getMetadata(Payment).tableName).toBe('payments');
  });
});
