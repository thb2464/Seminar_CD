import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import type { User } from '../users/user.entity';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export interface AuthResponse {
  jwt: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid identifier or password.');
    }
    const ok = await this.users.verifyPassword(user, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid identifier or password.');
    }
    return this.issue(user);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.users.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      fullName: dto.full_name ?? null,
      phone: dto.phone ?? null,
    });
    return this.issue(user);
  }

  private issue(user: User): AuthResponse {
    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      iss: 'identity-service',
    });
    return { jwt: token, user: this.users.toPublic(user) };
  }
}
