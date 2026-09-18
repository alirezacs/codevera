import { z } from "zod";
import { nameSchema, phoneSchema, localeSchema } from "../common/validation.js";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + "T00:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, "Use a valid ISO date.");
export const settingsSchema = z
  .object({
    timezone: z.literal("UTC"),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((v) => new Set(v).size === v.length),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
    durationMinutes: z.number().int().min(15).max(120),
    advanceDays: z.number().int().min(1).max(90),
    minimumNoticeHours: z.number().int().min(0).max(720),
    unavailableDates: z.array(date).max(500),
    blockedSlots: z
      .array(z.string().regex(/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/))
      .max(2000),
  })
  .strict()
  .refine(
    (v) =>
      v.endHour > v.startHour &&
      v.durationMinutes <= (v.endHour - v.startHour) * 60,
    "Invalid working hours or duration.",
  );
export type Settings = z.infer<typeof settingsSchema>;
export const bookingSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    date,
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    locale: localeSchema,
  })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(["cancelled", "completed"]) })
  .strict();
export const messageSchema = z
  .object({
    name: nameSchema,
    contact: z
      .string()
      .trim()
      .max(200)
      .refine(
        (v) =>
          z.email().safeParse(v).success || phoneSchema.safeParse(v).success,
        "Please enter a valid email address or phone number.",
      )
      .transform((v) => {
        const p = phoneSchema.safeParse(v);
        return p.success ? p.data : v;
      }),
    message: z
      .string()
      .trim()
      .min(10, "Please tell us a little more (at least 10 characters).")
      .max(5000, "Please keep your message under 5,000 characters."),
    locale: localeSchema,
  })
  .strict();
