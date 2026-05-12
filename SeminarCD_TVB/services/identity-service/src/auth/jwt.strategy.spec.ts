import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';

function makeUser(partial: Partial<User> = {}): User {
  const u = new User();
  Object.assign(
    u,
    {
      id: 1,
      username: 'tan',
      email: 'tan@example.com',
      password: '$2a$10$hash',
      provider: 'local',
      confirmed: true,
      blocked: false,
      fullName: null,
      phone: null,
      role: 'authenticated',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User,
    partial,
  );
  return u;
}

describe('JwtStrategy', () => {
  let users: jest.Mocked<UsersService>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    users = { findById: jest.fn() } as unknown as jest.Mocked<UsersService>;
    const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') } as unknown as ConfigService;
    strategy = new JwtStrategy(config, users);
  });

  it('rejects payload without sub', async () => {
    await expect(strategy.validate({} as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unknown user', async () => {
    users.findById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 99, username: 'ghost' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects blocked user', async () => {
    users.findById.mockResolvedValue(makeUser({ blocked: true }));
    await expect(strategy.validate({ sub: 1, username: 'tan' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns the user when payload is valid', async () => {
    const user = makeUser();
    users.findById.mockResolvedValue(user);
    const result = await strategy.validate({ sub: 1, username: 'tan' });
    expect(result).toBe(user);
  });
});
