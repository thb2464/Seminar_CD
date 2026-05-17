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
      tour = json?.data ?? json;
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
      tour = json?.data ?? json;
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

    // Fire-and-forget — RabbitMQ publish must not block the user's response.
    // Without confirm channels the publisher would otherwise stall on a bad
    // connection and Kong would 504 even though the booking is already saved.
    void this.eventsPublisher.publishBookingCreated(savedBooking).catch(() => undefined);

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
          const t = res?.data ?? res;
          if (t && t.id) {
            tourMap[t.id] = { name: t.tourName || t.tour_name, slug: t.slug };
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

  /** Admin: every booking joined with its tour name/slug. */
  async adminListAll(limit = 200) {
    const bookings = await this.bookingRepo.find({
      order: { bookingDate: 'DESC' },
      take: Math.min(Math.max(1, limit), 1000),
    });
    const tourIds = [...new Set(bookings.map((b) => b.tourId))];
    const tourMap: Record<number, { name: string; slug: string }> = {};
    if (tourIds.length > 0) {
      const results = await Promise.all(
        tourIds.map((id) =>
          fetch(`${this.catalogUrl}/api/tours/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
      for (const res of results) {
        const t = res?.data ?? res;
        if (t && t.id) {
          tourMap[t.id] = {
            name: t.tourName || t.tour_name || 'Unknown',
            slug: t.slug || '',
          };
        }
      }
    }
    return {
      data: bookings.map((b) => ({
        id: b.id,
        user_id: b.userId,
        tour_id: b.tourId,
        tour_name: tourMap[b.tourId]?.name || 'Unknown Tour',
        tour_slug: tourMap[b.tourId]?.slug || '',
        adult_count: b.adultCount,
        child_count: b.childCount,
        travel_date: b.travelDate,
        total_price: b.totalPrice,
        status: b.status,
        payment_ref: b.paymentRef,
        booking_date: b.bookingDate,
        contact_name: b.contactName,
        contact_email: b.contactEmail,
        contact_phone: b.contactPhone,
        refund_amount: b.refundAmount,
        refund_status: b.refundStatus,
        cancelled_at: b.cancelledAt,
      })),
    };
  }

  /** Admin: pre-aggregated stats for the dashboard. */
  async adminStats() {
    const today = new Date().toISOString().split('T')[0];

    const totalsByStatus = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(b.total_price), 0)', 'revenue')
      .groupBy('b.status')
      .getRawMany();

    // Bookings grouped by the month they were placed (last 12 months).
    const monthly = await this.bookingRepo
      .createQueryBuilder('b')
      .select("to_char(b.booking_date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(b.total_price), 0)', 'revenue')
      .where("b.booking_date IS NOT NULL")
      .andWhere("b.booking_date > NOW() - INTERVAL '12 months'")
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Upcoming tours: travel dates that haven't happened yet (status Pending/Paid).
    const upcoming = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.tour_id', 'tour_id')
      .addSelect('b.travel_date', 'travel_date')
      .addSelect(
        'SUM(b.adult_count + b.child_count)',
        'pax',
      )
      .where('b.travel_date >= :today', { today })
      .andWhere("b.status IN ('Pending', 'Paid')")
      .groupBy('b.tour_id, b.travel_date')
      .orderBy('b.travel_date', 'ASC')
      .limit(20)
      .getRawMany();

    const tourIds = [...new Set(upcoming.map((u) => Number(u.tour_id)))];
    const tourMap: Record<number, string> = {};
    if (tourIds.length > 0) {
      const results = await Promise.all(
        tourIds.map((id) =>
          fetch(`${this.catalogUrl}/api/tours/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
      for (const res of results) {
        const t = res?.data ?? res;
        if (t && t.id) tourMap[t.id] = t.tourName || t.tour_name || 'Unknown';
      }
    }

    return {
      data: {
        totals: {
          totalBookings: totalsByStatus.reduce((s, r) => s + parseInt(r.count, 10), 0),
          totalRevenue: totalsByStatus
            .filter((r) => r.status === 'Paid')
            .reduce((s, r) => s + parseInt(r.revenue || '0', 10), 0),
          pending: parseInt(totalsByStatus.find((r) => r.status === 'Pending')?.count || '0', 10),
          paid: parseInt(totalsByStatus.find((r) => r.status === 'Paid')?.count || '0', 10),
          cancelled: parseInt(totalsByStatus.find((r) => r.status === 'Cancelled')?.count || '0', 10),
        },
        byStatus: totalsByStatus.map((r) => ({
          status: r.status,
          count: parseInt(r.count, 10),
          revenue: parseInt(r.revenue || '0', 10),
        })),
        monthly: monthly.map((r) => ({
          month: r.month,
          count: parseInt(r.count, 10),
          revenue: parseInt(r.revenue || '0', 10),
        })),
        upcoming: upcoming.map((u) => ({
          tour_id: Number(u.tour_id),
          tour_name: tourMap[Number(u.tour_id)] || 'Unknown',
          travel_date: u.travel_date,
          pax: parseInt(u.pax, 10),
        })),
      },
    };
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

    void this.eventsPublisher.publishBookingCancelled(booking).catch(() => undefined);

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
