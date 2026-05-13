import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { PaymentEventsPublisher } from '../events/payment-events.publisher';

jest.mock('opossum', () => {
  return jest.fn().mockImplementation(() => ({
    fallback: jest.fn(),
    on: jest.fn(),
    fire: jest.fn(),
  }));
});

describe('PaymentService', () => {
  let service: PaymentService;
  let repo: any;
  let publisher: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'VNPAY_TMN_CODE') return 'tmncode';
              if (key === 'VNPAY_HASH_SECRET') return 'secret';
              if (key === 'VNPAY_URL') return 'http://vnpay.url';
              if (key === 'VNPAY_RETURN_URL') return 'http://return.url';
              if (key === 'VNPAY_API_URL') return 'http://vnpay.api';
              return null;
            }),
          },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PaymentEventsPublisher,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    repo = module.get(getRepositoryToken(Payment));
    publisher = module.get(PaymentEventsPublisher);
  });

  it('should throw NotFoundException if payment not found for createPaymentUrl', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.createPaymentUrl(1)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if payment status is Completed', async () => {
    repo.findOne.mockResolvedValue({ status: 'Completed' });
    await expect(service.createPaymentUrl(1)).rejects.toThrow(BadRequestException);
  });

  it('should create payment url', async () => {
    repo.findOne.mockResolvedValue({ status: 'Pending', amount: '1000' });
    repo.save.mockResolvedValue({});
    const url = await service.createPaymentUrl(1);
    expect(url).toContain('http://vnpay.url');
    expect(url).toContain('vnp_Amount=100000');
  });

  it('should return failed status on processVnpayReturn with invalid hash', async () => {
    const query = { vnp_SecureHash: 'invalid' };
    const res = await service.processVnpayReturn(query);
    expect(res.status).toBe('failed');
    expect(res.reason).toBe('invalid_checksum');
  });
});
