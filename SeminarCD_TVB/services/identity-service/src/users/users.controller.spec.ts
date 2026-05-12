import { Test, TestingModule } from '@nestjs/testing';

import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

function makeUser(): User {
  const u = new User();
  Object.assign(u, {
    id: 1,
    username: 'tan',
    email: 'tan@example.com',
    password: '$2a$10$hash',
    provider: 'local',
    confirmed: true,
    blocked: false,
    fullName: 'Tan Nguyen',
    phone: '0900000000',
    role: 'authenticated',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User);
  return u;
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    service = {
      toPublic: jest.fn().mockImplementation((u: User) => {
        const { password: _drop, ...rest } = u;
        return rest;
      }),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('returns the authenticated user without the password field', async () => {
    const user = makeUser();
    const result = await controller.me(user);
    expect((result as any).password).toBeUndefined();
    expect(result.username).toBe('tan');
    expect(service.toPublic).toHaveBeenCalledWith(user);
  });
});
