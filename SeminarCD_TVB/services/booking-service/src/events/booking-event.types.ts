import { Booking } from '../booking/entities/booking.entity';

export const BOOKING_CREATED = 'BookingCreated';
export const BOOKING_CANCELLED = 'BookingCancelled';

export type BookingEventType = typeof BOOKING_CREATED | typeof BOOKING_CANCELLED;

export interface BookingEventEnvelope<T = unknown> {
  type: BookingEventType;
  occurredAt: string;
  service: 'booking-service';
  payload: T;
}

export interface BookingEventPayload {
  id: number;
  documentId: string;
  userId: number;
  tourId: number;
  totalPrice: string;
  status: string;
  paymentRef: string;
  bookingDate: string;
}

export function toBookingPayload(booking: Booking): BookingEventPayload {
  return {
    id: booking.id,
    documentId: booking.documentId,
    userId: booking.userId,
    tourId: booking.tourId,
    totalPrice: booking.totalPrice,
    status: booking.status,
    paymentRef: booking.paymentRef,
    bookingDate: (booking.bookingDate ?? new Date()).toISOString(),
  };
}
