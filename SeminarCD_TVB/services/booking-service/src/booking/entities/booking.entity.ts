import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'tour_id' })
  tourId: number;

  @Column({ name: 'adult_count' })
  adultCount: number;

  @Column({ name: 'child_count', default: 0 })
  childCount: number;

  @Column({ name: 'travel_date' })
  travelDate: string;

  @Column({ name: 'total_price', type: 'bigint' })
  totalPrice: string;

  @Column({ default: 'Pending' })
  status: string;

  @Column({ name: 'payment_ref', nullable: true })
  paymentRef: string;

  @Column({ name: 'vnpay_transaction_no', nullable: true })
  vnpayTransactionNo: string;

  @Column({ name: 'booking_date', type: 'timestamp', nullable: true })
  bookingDate: Date;

  @Column({ name: 'contact_name' })
  contactName: string;

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone' })
  contactPhone: string;

  @Column({ name: 'refund_amount', type: 'bigint', default: '0' })
  refundAmount: string;

  @Column({ name: 'refund_status', nullable: true })
  refundStatus: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
