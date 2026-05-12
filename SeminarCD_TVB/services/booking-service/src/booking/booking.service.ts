import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BookingEventsPublisher } from '../events/booking-events.publisher';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly configService: ConfigService,
    private readonly eventsPublisher: BookingEventsPublisher,
  ) {}

  private get catalogUrl() {
    return this.configService.get<string>('CATALOG_SERVICE_URL', 'http://localhost:3001');
  }

  async getAvailability(tourId: number, date: string) {
    if (!tourId || !date) {
      throw new BadRequestException('Missing tourId or date query parameter.');
    }

    let tour;
    try {
      const response = await fetch(`${this.catalogUrl}/api/tours/${tourId}`);
      if (!response.ok) {
        if (response.status === 404) throw new NotFoundException('Tour not found.');
        throw new Error('Failed to fetch tour');
      }
      const json = await response.json();
      tour = json.data;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Could not connect to catalog service.');
    }

    const maxParticipants = tour.maxParticipants ?? tour.max_participants ?? 999;

    const bookedResult = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(booking.adult_count + booking.child_count), 0)', 'booked_count')
      .where('booking.tour_id = :tourId', { tourId })
      .andWhere('booking.travel_date = :date', { date })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['Pending', 'Paid'] })
      .getRawOne();

    const bookedCount = parseInt(bookedResult?.booked_count) || 0;
    const remaining = Math.max(0, maxParticipants - bookedCount);

    return {
      data: {
        tourId: Number(tourId),
        date,
        maxParticipants,
        bookedCount,
        remaining,
        isSoldOut: remaining === 0,
      },
    };
  }

  async create(user: any, dto: CreateBookingDto) {
    const { tour: tourId, adult_count, child_count = 0, travel_date, contact_name, contact_email, contact_phone } = dto;
    const requested = adult_count + child_count;

    let tour;
    try {
      const response = await fetch(`${this.catalogUrl}/api/tours/${tourId}`);
      if (!response.ok) {
        if (response.status === 404) throw new NotFoundException('Tour not found.');
        throw new Error('Failed to fetch tour');
      }
      const json = await response.json();
      tour = json.data;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Could not connect to catalog service.');
    }

    const maxParticipants = tour.maxParticipants ?? tour.max_participants ?? 999;
    const adultPrice = parseInt(tour.price) || 0;
    const childPrice = parseInt(tour.childPrice ?? tour.child_price) || adultPrice;

    const bookedResult = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(booking.adult_count + booking.child_count), 0)', 'booked_count')
      .where('booking.tour_id = :tourId', { tourId })
      .andWhere('booking.travel_date = :travelDate', { travelDate: travel_date })
      .andWhere('booking.status IN (:...statuses)', { statuses: ['Pending', 'Paid'] })
      .getRawOne();

    const bookedCount = parseInt(bookedResult?.booked_count) || 0;
    const remaining = maxParticipants - bookedCount;

    if (requested > remaining) {
      throw new BadRequestException('Not enough spots available for this tour on the selected date.');
    }

    const totalPrice = (adult_count * adultPrice) + (child_count * childPrice);
    const paymentRef = `BOOK_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();

    const booking = this.bookingRepo.create({
      documentId: crypto.randomUUID(),
      userId: user.id,
      tourId,
      adultCount: adult_count,
      childCount: child_count,
      travelDate: travel_date,
      totalPrice: totalPrice.toString(),
      status: 'Pending',
      paymentRef,
      bookingDate: now,
      contactName: contact_name,
      contactEmail: contact_email,
      contactPhone: contact_phone,
    });

    const savedBooking = await this.bookingRepo.save(booking);
    
    await this.eventsPublisher.publishBookingCreated(savedBooking).catch(() => undefined);

    return {
      data: {
        id: savedBooking.id,
        total_price: totalPrice.toString(),
        payment_ref: paymentRef,
        status: 'Pending',
        remaining: remaining - requested,
      }
    };
  }

  async myBookings(user: any) {
    const bookings = await this.bookingRepo.find({
      where: { userId: user.id },
      order: { bookingDate: 'DESC' },
    });

    const tourIds = [...new Set(bookings.map(b => b.tourId))];
    const tourMap: Record<number, any> = {};
    if (tourIds.length > 0) {
      try {
        const tourPromises = tourIds.map(id => 
          fetch(`${this.catalogUrl}/api/tours/${id}`).then(res => res.ok ? res.json() : null)
        );
        const results = await Promise.all(tourPromises);
        results.forEach(res => {
          if (res && res.data) {
            tourMap[res.data.id] = { name: res.data.tourName || res.data.tour_name, slug: res.data.slug };
          }
        });
      } catch (e) {
        // ignore fetch errors
      }
    }

    const enrichedBookings = bookings.map(b => {
      const tour = tourMap[b.tourId];
      return {
        id: b.id,
        adult_count: b.adultCount,
        child_count: b.childCount,
        travel_date: b.travelDate,
        total_price: b.totalPrice,
        status: b.status,
        payment_ref: b.paymentRef,
        booking_date: b.bookingDate,
        contact_name: b.contactName,
        refund_amount: b.refundAmount,
        refund_status: b.refundStatus,
        cancelled_at: b.cancelledAt,
        tour_name: tour?.name || 'Unknown Tour',
        tour_slug: tour?.slug || '',
      };
    });

    return { data: enrichedBookings };
  }

  async cancelBooking(user: any, bookingId: number) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, userId: user.id } });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (!['Pending', 'Paid'].includes(booking.status)) {
      throw new BadRequestException('Only Pending or Paid bookings can be cancelled.');
    }

    const today = new Date().toISOString().split('T')[0];
    if (booking.travelDate < today) {
      throw new BadRequestException('Cannot cancel a booking with a past travel date.');
    }

    const now = new Date();
    const bookingDate = new Date(booking.bookingDate || booking.createdAt);
    const hoursSinceBooking = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursSinceBooking <= 24) {
      refundPercentage = 100;
    } else if (hoursSinceBooking <= 72) {
      refundPercentage = 85;
    } else {
      refundPercentage = 0;
    }

    const totalPrice = parseInt(booking.totalPrice) || 0;
    const refundAmount = Math.floor(totalPrice * refundPercentage / 100);

    let refundStatus = 'none';
    if (refundAmount === 0) {
      refundStatus = 'no_refund';
    } else if (booking.status === 'Pending') {
      refundStatus = 'not_charged';
    } else {
      refundStatus = 'pending_manual'; 
    }

    booking.status = 'Cancelled';
    booking.refundAmount = refundAmount.toString();
    booking.refundStatus = refundStatus;
    booking.cancelledAt = now;

    await this.bookingRepo.save(booking);

    await this.eventsPublisher.publishBookingCancelled(booking).catch(() => undefined);

    return {
      data: {
        id: booking.id,
        status: 'Cancelled',
        refund_amount: refundAmount.toString(),
        refund_percentage: refundPercentage,
        refund_status: refundStatus,
        cancelled_at: now.toISOString(),
      }
    };
  }
}
