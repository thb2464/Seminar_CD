import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

function makeUser(partial: Partial<User> = {}): User {
  const user = new User();
  Object.assign(
    user,
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
  return user;
}

describe('AuthService', () => {
  let users: jest.Mocked<UsersService>;
  let jwt: jest.Mocked<JwtService>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByIdentifier: jest.fn(),
      verifyPassword: jest.fn(),
      create: jest.fn(),
      toPublic: jest.fn((u: User) => {
        const { password: _drop, ...rest } = u;
        return rest;
      }),
    } as unknown as jest.Mocked<UsersService>;
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') } as unknown as jest.Mocked<JwtService>;
    service = new AuthService(users, jwt);
  });

  it('login returns jwt + sanitised user', async () => {
    const user = makeUser();
    users.findByIdentifier.mockResolvedValue(user);
    users.verifyPassword.mockResolvedValue(true);

    const response = await service.login({ identifier: 'tan', password: 'secret123' });

    expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, username: 'tan' });
    expect(response.jwt).toBe('signed.jwt.token');
    expect((response.user as any).password).toBeUndefined();
  });

  it('login rejects unknown identifier', async () => {
    users.findByIdentifier.mockResolvedValue(null);
    await expect(service.login({ identifier: 'nobody', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login rejects wrong password', async () => {
    users.findByIdentifier.mockResolvedValue(makeUser());
    users.verifyPassword.mockResolvedValue(false);
    await expect(
      service.login({ identifier: 'tan', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register creates the user and issues a token', async () => {
    const created = makeUser({ id: 42, username: 'newby' });
    users.create.mockResolvedValue(created);

    const response = await service.register({
      username: 'newby',
      email: 'newby@example.com',
      password: 'secret123',
      full_name: 'New B.',
      phone: '0900000001',
    });

    expect(users.create).toHaveBeenCalledWith({
      username: 'newby',
      email: 'newby@example.com',
      password: 'secret123',
      fullName: 'New B.',
      phone: '0900000001',
    });
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 42, username: 'newby' });
    expect(response.user.id).toBe(42);
  });
});
