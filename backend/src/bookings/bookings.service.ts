import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PoolClient } from "pg";
import { Database } from "../database/database.js";
import { Settings, bookingSchema } from "./schemas.js";
import { z } from "zod";
export function scheduledSlots(
  settings: Settings,
  date: string,
  now = new Date(),
) {
  const day = new Date(`${date}T00:00:00Z`);
  const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  if (
    Number.isNaN(day.getTime()) ||
    day.toISOString().slice(0, 10) !== date ||
    day < today ||
    day.getTime() >= today.getTime() + settings.advanceDays * 86400000 ||
    !settings.workingDays.includes(day.getUTCDay()) ||
    settings.unavailableDates.includes(date)
  )
    return [];
  const slots: string[] = [];
  for (
    let minutes = settings.startHour * 60;
    minutes + settings.durationMinutes <= settings.endHour * 60;
    minutes += settings.durationMinutes
  ) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    if (
      new Date(`${date}T${time}:00Z`).getTime() >=
        now.getTime() + settings.minimumNoticeHours * 3600000 &&
      !settings.blockedSlots.includes(`${date}T${time}`)
    )
      slots.push(time);
  }
  return slots;
}
@Injectable()
export class BookingsService {
  constructor(private readonly db: Database) {}
  async settings(client?: PoolClient, lock = false) {
    const sql =
      "SELECT data FROM consultation_settings WHERE id=1" +
      (lock ? " FOR SHARE" : "");
    const result = client
      ? await client.query<{ data: Settings }>(sql)
      : await this.db.query<{ data: Settings }>(sql);
    if (!result.rows[0])
      throw new NotFoundException(
        "Consultation schedule has not been configured.",
      );
    return result.rows[0].data;
  }
  async availability() {
    const settings = await this.settings();
    const now = new Date();
    const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
    const last = new Date(today.getTime() + settings.advanceDays * 86400000);
    const booked = (
      await this.db.query<{ starts_at: Date; ends_at: Date }>(
        "SELECT starts_at,ends_at FROM bookings WHERE status='confirmed' AND ends_at>$1 AND starts_at<$2",
        [today, last],
      )
    ).rows;
    const dates = Array.from({ length: settings.advanceDays }, (_, i) => {
      const date = new Date(today.getTime() + i * 86400000)
        .toISOString()
        .slice(0, 10);
      return {
        date,
        slots: scheduledSlots(settings, date, now).filter((time) => {
          const start = new Date(`${date}T${time}:00Z`).getTime();
          return !booked.some(
            (b) =>
              start < b.ends_at.getTime() &&
              start + settings.durationMinutes * 60000 > b.starts_at.getTime(),
          );
        }),
      };
    });
    return {
      dates,
      timezone: settings.timezone,
      duration: settings.durationMinutes,
    };
  }
  async create(body: z.infer<typeof bookingSchema>) {
    return this.db.transaction(async (client) => {
      const settings = await this.settings(client, true);
      if (!scheduledSlots(settings, body.date).includes(body.startTime))
        throw new ConflictException(
          "That time is no longer available. Please choose another slot.",
        );
      const startsAt = new Date(`${body.date}T${body.startTime}:00Z`);
      const endsAt = new Date(
        startsAt.getTime() + settings.durationMinutes * 60000,
      );
      const result = await client.query<{ id: string }>(
        `INSERT INTO bookings(name,phone,starts_at,ends_at,locale) VALUES($1,$2,$3,$4,$5) RETURNING id`,
        [body.name, body.phone, startsAt, endsAt, body.locale],
      );
      return {
        booking: {
          id: result.rows[0].id,
          name: body.name,
          date: body.date,
          startTime: body.startTime,
          endTime: endsAt.toISOString().slice(11, 16),
        },
      };
    });
  }
  async saveSettings(settings: Settings, actor: string) {
    return this.db.transaction(async (c) => {
      await c.query(
        "INSERT INTO consultation_settings(id,data) VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=now()",
        [JSON.stringify(settings)],
      );
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,'update','consultation_settings','1')",
        [actor],
      );
      return settings;
    });
  }
}
