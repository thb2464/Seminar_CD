import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Payment } from '../src/payment/entities/payment.entity';
import {
  PostgresTestEnvironment,
  startPostgresTestEnvironment,
} from './postgres-testcontainer';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let postgres: PostgresTestEnvironment;

  beforeAll(async () => {
    postgres = await startPostgresTestEnvironment({
      database: 'payment_test',
      username: 'payment',
      password: 'payment',
      entities: [Payment],
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

  afterAll(async () => {
    await app.close();
    await postgres.stop();
  }, 120_000);
});
