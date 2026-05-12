import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as qs from 'qs';
import axios from 'axios';
import { Payment } from './entities/payment.entity';
import { sortObject, formatVnpDate } from '../vnpay-transaction/vnpay-helpers';
import { PaymentEventsPublisher } from '../events/payment-events.publisher';
import { PAYMENT_COMPLETED, PAYMENT_FAILED } from '../events/payment-event.types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private config: ConfigService,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private publisher: PaymentEventsPublisher,
  ) {}

  async createPaymentUrl(bookingId: number, ipAddr: string = '127.0.0.1'): Promise<string> {
    const payment = await this.paymentRepo.findOne({ where: { bookingId } });
    if (!payment) throw new NotFoundException('Payment record not found.');
    if (!['Pending', 'Failed'].includes(payment.status)) {
      throw new BadRequestException('Payment must be Pending or Failed to generate URL.');
    }

    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE');
    const secretKey = this.config.get<string>('VNPAY_HASH_SECRET');
    const vnpUrl = this.config.get<string>('VNPAY_URL');
    const returnUrl = this.config.get<string>('VNPAY_RETURN_URL');

    if (!tmnCode || !secretKey) {
      throw new BadRequestException('VNPay configuration is missing.');
    }

    const txnRef = `${bookingId}_${Date.now()}`;
    const amount = parseInt(payment.amount) * 100;
    const orderInfo = `Thanh toan dat tour ${bookingId}`;

    let vnpParams: any = {};
    vnpParams['vnp_Version'] = '2.1.0';
    vnpParams['vnp_Command'] = 'pay';
    vnpParams['vnp_TmnCode'] = tmnCode;
    vnpParams['vnp_Locale'] = 'vn';
    vnpParams['vnp_CurrCode'] = 'VND';
    vnpParams['vnp_TxnRef'] = txnRef;
    vnpParams['vnp_OrderInfo'] = orderInfo;
    vnpParams['vnp_OrderType'] = 'other';
    vnpParams['vnp_Amount'] = amount;
    vnpParams['vnp_ReturnUrl'] = returnUrl;
    vnpParams['vnp_IpAddr'] = ipAddr;
    vnpParams['vnp_CreateDate'] = formatVnpDate(new Date());

    payment.paymentRef = txnRef;
    await this.paymentRepo.save(payment);

    vnpParams = sortObject(vnpParams);
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;

    return `${vnpUrl}?${qs.stringify(vnpParams, { encode: false })}`;
  }

  async processVnpayReturn(query: any): Promise<{ url: string; status: string; bookingId?: string; reason?: string }> {
    const vnpParams = { ...query };
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const secretKey = this.config.get<string>('VNPAY_HASH_SECRET') || '';
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');

    const sorted = sortObject(vnpParams);
    const signData = qs.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const checksum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const txnRef = vnpParams['vnp_TxnRef'] || '';
    const bookingIdStr = txnRef ? txnRef.split('_')[0] : null;
    const bookingId = bookingIdStr ? parseInt(bookingIdStr) : null;
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionNo = vnpParams['vnp_TransactionNo'] || '';

    if (secureHash !== checksum) {
      if (bookingId) {
        await this.markPaymentFailed(bookingId);
      }
      return { url: `${frontendUrl}/payment-return?status=failed&bookingId=${bookingId || ''}&reason=invalid_checksum`, status: 'failed', bookingId: bookingIdStr, reason: 'invalid_checksum' };
    }

    if (responseCode === '00') {
      if (bookingId) {
        const payment = await this.paymentRepo.findOne({ where: { bookingId } });
        if (payment && payment.status !== 'Completed' && payment.status !== 'Cancelled') {
          payment.status = 'Completed';
          payment.vnpayTransactionNo = transactionNo;
          await this.paymentRepo.save(payment);

          await this.publisher.publish(PAYMENT_COMPLETED, {
            bookingId,
            paymentRef: txnRef,
            transactionNo,
            amount: payment.amount,
          });
        }
      }
      return { url: `${frontendUrl}/payment-return?status=success&bookingId=${bookingId || ''}`, status: 'success', bookingId: bookingIdStr };
    } else {
      if (bookingId) {
        await this.markPaymentFailed(bookingId);
      }
      return { url: `${frontendUrl}/payment-return?status=failed&bookingId=${bookingId || ''}&reason=vnpay_${responseCode}`, status: 'failed', bookingId: bookingIdStr, reason: `vnpay_${responseCode}` };
    }
  }

  private async markPaymentFailed(bookingId: number) {
    const payment = await this.paymentRepo.findOne({ where: { bookingId } });
    if (payment && payment.status === 'Pending') {
      payment.status = 'Failed';
      await this.paymentRepo.save(payment);

      await this.publisher.publish(PAYMENT_FAILED, {
        bookingId,
        paymentRef: payment.paymentRef,
        amount: payment.amount,
      });
    }
  }

  async processRefund(bookingId: number, refundAmount: number, initiatedBy: string = 'system'): Promise<any> {
    const payment = await this.paymentRepo.findOne({ where: { bookingId } });
    if (!payment) throw new NotFoundException('Payment record not found.');
    if (payment.status !== 'Completed') throw new BadRequestException('Cannot refund uncompleted payment.');
    
    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE');
    const secretKey = this.config.get<string>('VNPAY_HASH_SECRET');
    if (!tmnCode || !secretKey) throw new BadRequestException('VNPay configuration is missing.');

    const vnpRequestId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const createDate = formatVnpDate(new Date());
    const txnRef = payment.paymentRef;
    const transactionNo = payment.vnpayTransactionNo;
    const transactionDate = payment.updatedAt ? formatVnpDate(payment.updatedAt) : createDate;

    const params: any = {
      vnp_RequestId: vnpRequestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: '02',
      vnp_TxnRef: txnRef,
      vnp_Amount: refundAmount * 100,
      vnp_TransactionNo: transactionNo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateBy: initiatedBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1',
      vnp_OrderInfo: `Refund booking ${bookingId}`,
    };

    const signData = [
      params.vnp_RequestId, params.vnp_Version, params.vnp_Command, params.vnp_TmnCode,
      params.vnp_TransactionType, params.vnp_TxnRef, params.vnp_Amount, params.vnp_TransactionNo,
      params.vnp_TransactionDate, params.vnp_CreateBy, params.vnp_CreateDate, params.vnp_IpAddr,
      params.vnp_OrderInfo,
    ].join('|');

    const hmac = crypto.createHmac('sha512', secretKey);
    params.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const refundUrl = this.config.get<string>('VNPAY_API_URL', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
    
    try {
      const response = await axios.post(refundUrl, params, { timeout: 25000 });
      const result = response.data;
      if (result.vnp_ResponseCode === '00') {
        payment.status = 'Refunded';
        await this.paymentRepo.save(payment);
        return { success: true, responseCode: result.vnp_ResponseCode, message: result.vnp_Message };
      }
      return { success: false, responseCode: result.vnp_ResponseCode, message: result.vnp_Message };
    } catch (err: any) {
      this.logger.error(`Refund failed for booking ${bookingId}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
