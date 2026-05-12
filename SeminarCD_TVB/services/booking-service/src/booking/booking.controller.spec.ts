import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: {
            getAvailability: jest.fn(),
            create: jest.fn(),
            myBookings: jest.fn(),
            cancelBooking: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getAvailability', async () => {
    await controller.getAvailability('1', '2026-05-12');
    expect(service.getAvailability).toHaveBeenCalledWith(1, '2026-05-12');
  });

  it('should call create', async () => {
    const user = { id: 1 };
    const dto = { tour: 1, adult_count: 2, travel_date: '2026-05-12', contact_name: 'test', contact_email: 'test@test.com', contact_phone: '123' };
    await controller.create(user, dto);
    expect(service.create).toHaveBeenCalledWith(user, dto);
  });

  it('should call myBookings', async () => {
    const user = { id: 1 };
    await controller.myBookings(user);
    expect(service.myBookings).toHaveBeenCalledWith(user);
  });

  it('should call cancelBooking', async () => {
    const user = { id: 1 };
    await controller.cancelBooking(user, 1);
    expect(service.cancelBooking).toHaveBeenCalledWith(user, 1);
  });
});
