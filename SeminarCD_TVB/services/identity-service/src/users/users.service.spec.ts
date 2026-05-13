import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { UsersService } from './users.service';

type Repo = {
  findOne: jest.Mock;
  createQueryBuilder: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function buildQueryBuilder(result: User | null) {
  return {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

function buildRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn((value) => value as User),
    save: jest.fn(async (value) => value as User),
    ...overrides,
  };
}

function makeUser(partial: Partial<User> = {}): User {
  const user = new User();
  user.id = 1;
  user.username = 'tan';
  user.email = 'tan@example.com';
  user.password = '$2a$10$existing';
  user.provider = 'local';
  user.confirmed = true;
  user.blocked = false;
  user.fullName = null;
  user.phone = null;
  user.role = 'authenticated';
  user.createdAt = new Date();
  user.updatedAt = new Date();
  Object.assign(user, partial);
  return user;
}

describe('UsersService', () => {
  it('findByIdOrFail throws when missing', async () => {
    const repo = buildRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const service = new UsersService(repo as any);
    await expect(service.findByIdOrFail(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findByIdentifier normalises and queries both columns', async () => {
    const user = makeUser();
    const qb = buildQueryBuilder(user);
    const repo = buildRepo({ createQueryBuilder: jest.fn().mockReturnValue(qb) });
    const service = new UsersService(repo as any);

    const result = await service.findByIdentifier('TAN@example.com');

    expect(qb.where).toHaveBeenCalledWith('LOWER(user.username) = :id', { id: 'tan@example.com' });
    expect(qb.orWhere).toHaveBeenCalledWith('LOWER(user.email) = :id', { id: 'tan@example.com' });
    expect(result).toBe(user);
  });

  it('create hashes password and persists with defaults', async () => {
    const qb = buildQueryBuilder(null);
    const repo = buildRepo({ createQueryBuilder: jest.fn().mockReturnValue(qb) });
    const service = new UsersService(repo as any);

    const saved = await service.create({
      username: 'newby',
      email: 'newby@example.com',
      password: 'secret123',
      fullName: 'New B.',
      phone: '0900000001',
    });

    expect(repo.create).toHaveBeenCalled();
    expect(saved.password).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', saved.password)).toBe(true);
    expect(saved.provider).toBe('local');
    expect(saved.confirmed).toBe(true);
    expect(saved.role).toBe('authenticated');
    expect(saved.fullName).toBe('New B.');
  });

  it('create raises ConflictException when username or email taken', async () => {
    const taken = makeUser({ email: 'newby@example.com' });
    const qb = buildQueryBuilder(taken);
    const repo = buildRepo({ createQueryBuilder: jest.fn().mockReturnValue(qb) });
    const service = new UsersService(repo as any);

    await expect(
      service.create({ username: 'newby', email: 'newby@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifyPassword returns false for blocked users', async () => {
    const repo = buildRepo();
    const service = new UsersService(repo as any);
    const blocked = makeUser({ blocked: true, password: await bcrypt.hash('any', 4) });

    const ok = await service.verifyPassword(blocked, 'any');
    expect(ok).toBe(false);
  });

  it('verifyPassword delegates to bcrypt for active users', async () => {
    const repo = buildRepo();
    const service = new UsersService(repo as any);
    const user = makeUser({ password: await bcrypt.hash('right-password', 4) });

    expect(await service.verifyPassword(user, 'right-password')).toBe(true);
    expect(await service.verifyPassword(user, 'wrong-password')).toBe(false);
  });

  it('toPublic drops the password field', () => {
    const repo = buildRepo();
    const service = new UsersService(repo as any);
    const user = makeUser();
    const result = service.toPublic(user);
    expect((result as any).password).toBeUndefined();
    expect(result.username).toBe('tan');
  });
});
