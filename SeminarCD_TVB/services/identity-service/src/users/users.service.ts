import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from './user.entity';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName?: string | null;
  phone?: string | null;
}

@Injectable()
export class UsersService {
  private readonly bcryptRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const normalized = identifier.toLowerCase();
    return this.users
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :id', { id: normalized })
      .orWhere('LOWER(user.email) = :id', { id: normalized })
      .getOne();
  }

  async create(input: CreateUserInput): Promise<User> {
    await this.ensureNotTaken(input.username, input.email);
    const hashed = await bcrypt.hash(input.password, this.bcryptRounds);
    const user = this.users.create({
      username: input.username,
      email: input.email,
      password: hashed,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: 'authenticated',
      fullName: input.fullName ?? null,
      phone: input.phone ?? null,
    });
    return this.users.save(user);
  }

  async verifyPassword(user: User, plaintext: string): Promise<boolean> {
    if (user.blocked) {
      return false;
    }
    return bcrypt.compare(plaintext, user.password);
  }

  toPublic(user: User): Omit<User, 'password'> {
    const { password: _ignored, ...rest } = user;
    return rest;
  }

  private async ensureNotTaken(username: string, email: string): Promise<void> {
    const existing = await this.users
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :u', { u: username.toLowerCase() })
      .orWhere('LOWER(user.email) = :e', { e: email.toLowerCase() })
      .getOne();
    if (existing) {
      const reason = existing.email.toLowerCase() === email.toLowerCase() ? 'email' : 'username';
      throw new ConflictException(`A user with this ${reason} already exists.`);
    }
  }
}
