import { Controller, Post, Body, Get, Query, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-url')
  async createPaymentUrl(@Body() body: { bookingId: number }, @Req() req: any) {
    const ipAddr = req.ip || '127.0.0.1';
    const paymentUrl = await this.paymentService.createPaymentUrl(body.bookingId, ipAddr);
    return { paymentUrl };
  }

  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: any) {
    const result = await this.paymentService.processVnpayReturn(query);
    return res.redirect(result.url);
  }

  @Post('refund')
  async refund(@Body() body: { bookingId: number, amount: number }) {
    const result = await this.paymentService.processRefund(body.bookingId, body.amount);
    return { data: result };
  }
}
