import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import Database from 'better-sqlite3';

import { AppDataSource } from './data-source';
import { migrateUsersFromSqlite } from './migrate-from-sqlite';
import { User } from '../users/user.entity';

function makeFixtureDb(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'idsvc-mig-'));
  const filePath = path.join(tmp, 'data.db');
  const db = new Database(filePath);
  db.exec(`
    CREATE TABLE up_users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT,
      provider TEXT,
      confirmed INTEGER,
      blocked INTEGER,
      full_name TEXT,
      phone TEXT,
      role TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  const insert = db.prepare(`
    INSERT INTO up_users (id, username, email, password, provider, confirmed, blocked, full_name, phone, role, created_at, updated_at)
    VALUES (@id, @username, @email, @password, @provider, @confirmed, @blocked, @full_name, @phone, @role, @created_at, @updated_at)
  `);
  insert.run({
    id: 1,
    username: 'tan',
    email: 'tan@example.com',
    password: '$2a$10$existing',
    provider: 'local',
    confirmed: 1,
    blocked: 0,
    full_name: 'Tan Nguyen',
    phone: '0900000000',
    role: 'authenticated',
    created_at: '2025-12-01T00:00:00.000Z',
    updated_at: '2025-12-15T00:00:00.000Z',
  });
  insert.run({
    id: 2,
    username: 'noPasswordUser',
    email: 'broken@example.com',
    password: null,
    provider: 'local',
    confirmed: 0,
    blocked: 0,
    full_name: null,
    phone: null,
    role: null,
    created_at: '2025-12-02T00:00:00.000Z',
    updated_at: '2025-12-02T00:00:00.000Z',
  });
  db.close();
  return filePath;
}

describe('migrateUsersFromSqlite', () => {
  it('reports rows + skipped failures even when DataSource init fails', async () => {
    const fixturePath = makeFixtureDb();
    // Force AppDataSource.initialize to fail so we don't need a live Postgres in unit tests.
    const initSpy = jest
      .spyOn(AppDataSource, 'initialize')
      .mockRejectedValueOnce(new Error('postgres unavailable'));

    await expect(migrateUsersFromSqlite(fixturePath)).rejects.toThrow('postgres unavailable');
    expect(initSpy).toHaveBeenCalledTimes(1);
    initSpy.mockRestore();
  });

  it('classifies a row without password as failed before touching Postgres', async () => {
    const fixturePath = makeFixtureDb();
    const calls: Array<Partial<User>> = [];
    const fakeRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockImplementation((entity: Partial<User>) => {
        calls.push(entity);
        return Promise.resolve();
      }),
    } as unknown as ReturnType<typeof AppDataSource.getRepository>;

    jest.replaceProperty(AppDataSource, 'isInitialized', true);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockReturnValue(fakeRepo as ReturnType<typeof AppDataSource.getRepository>);
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);
    jest.spyOn(AppDataSource, 'destroy').mockResolvedValue();

    const result = await migrateUsersFromSqlite(fixturePath);

    expect(result.totalRead).toBe(2);
    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toEqual([{ id: 2, reason: 'missing password hash' }]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.id).toBe(1);
    expect(calls[0]?.password).toBe('$2a$10$existing');
    expect(calls[0]?.fullName).toBe('Tan Nguyen');
    expect(calls[0]?.confirmed).toBe(true);
    jest.restoreAllMocks();
  });

  it('skips users that already exist on the destination', async () => {
    const fixturePath = makeFixtureDb();
    const fakeRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 1 } as User)
        .mockResolvedValueOnce(null),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof AppDataSource.getRepository>;

    jest.replaceProperty(AppDataSource, 'isInitialized', true);
    jest
      .spyOn(AppDataSource, 'getRepository')
      .mockReturnValue(fakeRepo as ReturnType<typeof AppDataSource.getRepository>);
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);
    jest.spyOn(AppDataSource, 'destroy').mockResolvedValue();

    const result = await migrateUsersFromSqlite(fixturePath);

    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.failed).toEqual([{ id: 2, reason: 'missing password hash' }]);
    jest.restoreAllMocks();
  });
});
