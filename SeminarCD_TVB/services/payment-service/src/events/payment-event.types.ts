export const PAYMENT_COMPLETED = 'PaymentCompleted';
export const PAYMENT_FAILED = 'PaymentFailed';

export type PaymentEventType = typeof PAYMENT_COMPLETED | typeof PAYMENT_FAILED;

export interface PaymentEventEnvelope<T = unknown> {
  type: PaymentEventType;
  occurredAt: string;
  service: 'payment-service';
  payload: T;
}

export interface PaymentEventPayload {
  bookingId: number;
  paymentRef: string;
  transactionNo?: string;
  amount: string;
}
