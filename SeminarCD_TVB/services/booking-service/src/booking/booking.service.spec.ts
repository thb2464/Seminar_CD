import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { ConfigService } from '@nestjs/config';

describe('BookingService', () => {
  let service: BookingService;

  const mockRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ booked_count: 0 }),
    })),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) => ({ ...dto, id: 1 })),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('http://localhost:3001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  // Minimal tests for coverage, F5.11 handles comprehensive tests
});
