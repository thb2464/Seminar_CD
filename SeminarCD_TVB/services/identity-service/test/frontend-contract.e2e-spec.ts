import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { StrapiErrorFilter } from '../src/common/strapi-error.filter';
import { User } from '../src/users/user.entity';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

/**
 * Pinning the request/response shape that `Travel_TVB/src/context/AuthContext.jsx`
 * already expects. Any breaking change to the Identity Service DTOs or the
 * StrapiErrorFilter must update this snapshot AND the frontend in the same PR.
 */
describe('Frontend contract (AuthContext.jsx)', () => {
  let app: INestApplication;
  const users = new Map<number, User>();
  let nextId = 1;

  beforeAll(async () => {
    const userRepoMock = {
      findOne: ({ where: { id } }: { where: { id: number } }) =>
        Promise.resolve(users.get(id) ?? null),
      createQueryBuilder: () => {
        let collectedParam = '';
        const builder = {
          where: (_q: string, p: { id?: string; u?: string; e?: string }) => {
            collectedParam = (p.id ?? p.u ?? p.e ?? '').toLowerCase();
            return builder;
          },
          orWhere: (_q: string, p: { id?: string; u?: string; e?: string }) => {
            const second = (p.id ?? p.u ?? p.e ?? '').toLowerCase();
            const first = collectedParam;
            collectedParam = first;
            (builder as any).__second = second;
            return builder;
          },
          getOne: () => {
            const ids = [collectedParam, (builder as any).__second].filter(Boolean);
            for (const candidate of ids) {
              for (const user of users.values()) {
                if (
                  user.username.toLowerCase() === candidate ||
                  user.email.toLowerCase() === candidate
                ) {
                  return Promise.resolve(user);
                }
              }
            }
            return Promise.resolve(null);
          },
        };
        return builder;
      },
      create: (entity: Partial<User>) => entity as User,
      save: (entity: Partial<User>) => {
        const user = entity as User;
        user.id = user.id ?? nextId++;
        user.createdAt = user.createdAt ?? new Date();
        user.updatedAt = user.updatedAt ?? new Date();
        users.set(user.id, user);
        return Promise.resolve(user);
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'contract-test-secret', signOptions: { expiresIn: '15m' } }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: () => 'contract-test-secret' } },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new StrapiErrorFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register → returns { jwt, user } and 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/local/register')
      .send({
        username: 'tan',
        email: 'tan@example.com',
        password: 'secret123',
        full_name: 'Tan Nguyen',
        phone: '0900000000',
      })
      .expect(201);

    expect(response.body).toHaveProperty('jwt');
    expect(typeof response.body.jwt).toBe('string');
    expect(response.body.user).toMatchObject({
      id: expect.any(Number),
      username: 'tan',
      email: 'tan@example.com',
      role: 'authenticated',
    });
    expect(response.body.user.password).toBeUndefined();
  });

  it('login with same credentials → returns { jwt, user }', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/local')
      .send({ identifier: 'tan@example.com', password: 'secret123' })
      .expect(201);

    expect(response.body.jwt).toBeDefined();
    expect(response.body.user.username).toBe('tan');
  });

  it('login with wrong password → Strapi error envelope, 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/local')
      .send({ identifier: 'tan', password: 'wrong123' })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        status: 401,
        name: 'UnauthorizedException',
        message: 'Invalid identifier or password.',
      },
    });
  });

  it('register with invalid body → Strapi error envelope, 400, joined messages', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/local/register')
      .send({ username: 'x', email: 'not-an-email', password: '123' })
      .expect(400);

    expect(response.body.error.status).toBe(400);
    expect(response.body.error.message).toMatch(/;/);
  });

  it('/api/users/me with Bearer JWT → returns the user (no password)', async () => {
    const jwt = app.get(JwtService).sign({ sub: 1, username: 'tan', role: 'authenticated' });
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);

    expect(response.body.username).toBe('tan');
    expect(response.body.password).toBeUndefined();
  });

  it('/api/users/me without token → 401 in Strapi envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/users/me').expect(401);
    expect(response.body.error.status).toBe(401);
  });
});
