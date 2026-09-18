import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { Public, AdminRequest } from "../auth/guard.js";
import { Database } from "../database/database.js";
import { Validate, pagination, Pagination } from "../common/validation.js";
import { BookingsService } from "./bookings.service.js";
import {
  bookingSchema,
  settingsSchema,
  Settings,
  statusSchema,
  messageSchema,
} from "./schemas.js";
@ApiTags("Consultations and enquiries")
@Controller()
export class BookingController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly db: Database,
  ) {}
  @Public() @Get("availability") availability() {
    return this.bookings.availability();
  }
  @Public() @Get("consultation-settings") settings() {
    return this.bookings.settings();
  }
  @Public()
  @Post("bookings")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  create(
    @Body(new Validate(bookingSchema)) body: z.infer<typeof bookingSchema>,
  ) {
    return this.bookings.create(body);
  }
  @Public()
  @Post("contact")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async contact(
    @Body(new Validate(messageSchema)) body: z.infer<typeof messageSchema>,
  ) {
    await this.db.query(
      "INSERT INTO messages(name,contact,message,locale) VALUES($1,$2,$3,$4)",
      [body.name, body.contact, body.message, body.locale],
    );
    return {
      message:
        "Your message has been saved on this website. Email delivery is not connected yet; this does not send a notification to the team.",
    };
  }
}
@ApiTags("Admin consultations")
@ApiBearerAuth()
@Controller("admin")
export class AdminBookingController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly db: Database,
  ) {}
  @Get("consultation-settings") settings() {
    return this.bookings.settings();
  }
  @Put("consultation-settings") save(
    @Body(new Validate(settingsSchema)) body: Settings,
    @Req() req: AdminRequest,
  ) {
    return this.bookings.saveSettings(body, req.user.id);
  }
  @Get("bookings") async list(@Query(new Validate(pagination)) q: Pagination) {
    return this.listTable("bookings", q);
  }
  @Get("messages") async messages(
    @Query(new Validate(pagination)) q: Pagination,
  ) {
    return this.listTable("messages", q);
  }
  @Get("audit-logs") async audit(
    @Query(new Validate(pagination)) q: Pagination,
  ) {
    return this.listTable("audit_logs", q);
  }
  private async listTable(
    table: "bookings" | "messages" | "audit_logs",
    q: Pagination,
  ) {
    const total = Number(
      (
        await this.db.query<{ total: string }>(
          `SELECT count(*) AS total FROM ${table}`,
        )
      ).rows[0].total,
    );
    const items = (
      await this.db.query(
        `SELECT * FROM ${table} ORDER BY created_at DESC,id DESC LIMIT $1 OFFSET $2`,
        [q.limit, (q.page - 1) * q.limit],
      )
    ).rows;
    return { items, total, ...q };
  }
  @Patch("bookings/:id") async status(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new Validate(statusSchema)) body: z.infer<typeof statusSchema>,
    @Req() req: AdminRequest,
  ) {
    return this.db.transaction(async (c) => {
      const row = (
        await c.query(
          "UPDATE bookings SET status=$1,updated_at=now() WHERE id=$2 AND status='confirmed' RETURNING *",
          [body.status, id],
        )
      ).rows[0];
      if (!row) throw new NotFoundException("Confirmed booking not found.");
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,$2,$3,$4)",
        [req.user.id, body.status, "bookings", id],
      );
      return row;
    });
  }
  @Patch("messages/:id") @HttpCode(204) async messageStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(
      new Validate(
        z.object({ status: z.enum(["new", "read", "archived"]) }).strict(),
      ),
    )
    body: { status: string },
    @Req() req: AdminRequest,
  ) {
    await this.db.transaction(async (c) => {
      const result = await c.query(
        "UPDATE messages SET status=$1 WHERE id=$2",
        [body.status, id],
      );
      if (!result.rowCount) throw new NotFoundException("Message not found.");
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,$2,$3,$4)",
        [req.user.id, body.status, "messages", id],
      );
    });
  }
}
