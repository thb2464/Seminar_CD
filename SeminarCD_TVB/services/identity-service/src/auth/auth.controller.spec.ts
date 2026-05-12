import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    service = {
      login: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delegates login to the AuthService', async () => {
    service.login.mockResolvedValue({ jwt: 'tok', user: { id: 1 } as any });
    await expect(
      controller.login({ identifier: 'tan', password: 'secret123' }),
    ).resolves.toEqual({ jwt: 'tok', user: { id: 1 } });
    expect(service.login).toHaveBeenCalledWith({ identifier: 'tan', password: 'secret123' });
  });

  it('delegates register to the AuthService', async () => {
    service.register.mockResolvedValue({ jwt: 'tok', user: { id: 9 } as any });
    await controller.register({
      username: 'newby',
      email: 'newby@example.com',
      password: 'secret123',
      full_name: 'New B.',
      phone: '0900000001',
    });
    expect(service.register).toHaveBeenCalledWith({
      username: 'newby',
      email: 'newby@example.com',
      password: 'secret123',
      full_name: 'New B.',
      phone: '0900000001',
    });
  });
});
