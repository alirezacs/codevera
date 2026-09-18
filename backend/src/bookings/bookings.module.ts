import { Module } from "@nestjs/common";
import {
  BookingController,
  AdminBookingController,
} from "./bookings.controller.js";
import { BookingsService } from "./bookings.service.js";
@Module({
  controllers: [BookingController, AdminBookingController],
  providers: [BookingsService],
})
export class BookingsModule {}
