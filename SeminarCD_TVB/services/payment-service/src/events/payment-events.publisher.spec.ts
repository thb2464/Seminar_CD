import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentEventsPublisher, AMQP_CONNECTION } from './payment-events.publisher';

describe('PaymentEventsPublisher', () => {
  let publisher: PaymentEventsPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentEventsPublisher,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock') },
        },
        {
          provide: AMQP_CONNECTION,
          useValue: { connect: jest.fn().mockReturnValue({ createChannel: jest.fn() }) },
        },
      ],
    }).compile();

    publisher = module.get<PaymentEventsPublisher>(PaymentEventsPublisher);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });
});
