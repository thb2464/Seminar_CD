import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, HttpCode } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UserGuard } from '../common/user.guard';
import { AdminGuard } from '../common/admin.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('api/bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('availability')
  getAvailability(@Query('tourId') tourId: string, @Query('date') date: string) {
    return this.bookingService.getAvailability(parseInt(tourId, 10), date);
  }

  @UseGuards(UserGuard)
  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: any, @Body('data') dto: CreateBookingDto) {
    return this.bookingService.create(user, dto);
  }

  @UseGuards(UserGuard)
  @Get('my-bookings')
  myBookings(@CurrentUser() user: any) {
    return this.bookingService.myBookings(user);
  }

  @UseGuards(UserGuard)
  @Post(':id/cancel')
  cancelBooking(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancelBooking(user, id);
  }

  // --- Admin ---------------------------------------------------------------
  // Listed and ordered before any other admin work because `/admin/all` and
  // `/admin/stats` must match before the wildcard `:id/cancel` route would.

  @UseGuards(AdminGuard)
  @Get('admin/all')
  adminListAll(@Query('limit') limit?: string) {
    return this.bookingService.adminListAll(limit ? parseInt(limit, 10) : 200);
  }

  @UseGuards(AdminGuard)
  @Get('admin/stats')
  adminStats() {
    return this.bookingService.adminStats();
  }
}
