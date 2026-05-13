import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingEventsSubscriber } from './booking-events.subscriber';
import { AMQP_CONNECTION } from './payment-events.publisher';
import { Payment } from '../payment/entities/payment.entity';

describe('BookingEventsSubscriber', () => {
  let subscriber: BookingEventsSubscriber;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingEventsSubscriber,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock') },
        },
        {
          provide: AMQP_CONNECTION,
          useValue: { connect: jest.fn().mockReturnValue({ createChannel: jest.fn() }) },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    subscriber = module.get<BookingEventsSubscriber>(BookingEventsSubscriber);
  });

  it('should be defined', () => {
    expect(subscriber).toBeDefined();
  });
});
