import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            createPaymentUrl: jest.fn().mockResolvedValue('http://vnpay.url'),
            processVnpayReturn: jest.fn().mockResolvedValue({ url: 'http://frontend.url' }),
            processRefund: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should create payment url', async () => {
    const res = await controller.createPaymentUrl({ bookingId: 1 }, { ip: '127.0.0.1' });
    expect(res.paymentUrl).toBe('http://vnpay.url');
    expect(service.createPaymentUrl).toHaveBeenCalledWith(1, '127.0.0.1');
  });

  it('should redirect on vnpay return', async () => {
    const mockRes = { redirect: jest.fn() };
    await controller.vnpayReturn({ some: 'query' }, mockRes);
    expect(mockRes.redirect).toHaveBeenCalledWith('http://frontend.url');
    expect(service.processVnpayReturn).toHaveBeenCalledWith({ some: 'query' });
  });

  it('should process refund', async () => {
    const res = await controller.refund({ bookingId: 1, amount: 100 });
    expect(res.data.success).toBe(true);
    expect(service.processRefund).toHaveBeenCalledWith(1, 100);
  });
});
