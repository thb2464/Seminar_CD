import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id', unique: true })
  bookingId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ default: 'Pending' })
  status: string;

  @Column({ name: 'payment_ref' })
  paymentRef: string;

  @Column({ name: 'vnpay_transaction_no', nullable: true })
  vnpayTransactionNo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
