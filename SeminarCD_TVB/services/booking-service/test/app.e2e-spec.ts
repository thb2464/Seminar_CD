import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Booking } from '../src/booking/entities/booking.entity';
import {
  PostgresTestEnvironment,
  startPostgresTestEnvironment,
} from './postgres-testcontainer';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let postgres: PostgresTestEnvironment;

  beforeAll(async () => {
    postgres = await startPostgresTestEnvironment({
      database: 'booking_test',
      username: 'booking',
      password: 'booking',
      entities: [Booking],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 120_000);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('uses the PostgreSQL testcontainer database', async () => {
    const rows = (await postgres.dataSource.query(
      'SELECT current_database() AS database',
    )) as Array<{ database: string }>;

    expect(rows).toEqual([{ database: 'booking_test' }]);
    expect(postgres.dataSource.getMetadata(Booking).tableName).toBe('bookings');
  });

  afterAll(async () => {
    await app.close();
    await postgres.stop();
  }, 120_000);
});
