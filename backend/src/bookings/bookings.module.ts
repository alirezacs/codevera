import { Module } from "@nestjs/common";
import {
  BookingController,
  AdminBookingController,
} from "./bookings.controller";
import { BookingsService } from "./bookings.service";
@Module({
  controllers: [BookingController, AdminBookingController],
  providers: [BookingsService],
})
export class BookingsModule {}
