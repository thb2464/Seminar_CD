import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TravelDateModule } from './travel-date/travel-date.module';
import { ContactInfoModule } from './contact-info/contact-info.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [TravelDateModule, ContactInfoModule, BookingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
