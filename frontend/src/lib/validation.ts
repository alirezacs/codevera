import { normalizeDigits } from "@/i18n";
import { z } from "zod";
export const contactDetails = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Please use 100 characters or fewer.")
    .refine(
      (value) => !/[\x00-\x1F\x7F]/.test(value),
      "Please use a valid name.",
    ),
  phone: z
    .string()
    .trim()
    .transform(normalizeDigits)
    .pipe(
      z
        .string()
        .regex(
          /^\+?[\d\s().-]+$/,
          "Enter a valid phone number, including country code.",
        )
        .transform((value) => value.replace(/[\s().-]/g, ""))
        .refine(
          (value) => /^\+?\d{7,15}$/.test(value),
          "Use between 7 and 15 digits, including country code.",
        ),
    ),
});
export const bookingSchema = contactDetails.extend({
  locale: z.enum(["en","fa"]).default("en"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export const messageSchema = z.object({
  locale: z.enum(["en","fa"]).default("en"),
  name: contactDetails.shape.name,
  contact: z
    .string()
    .trim()
    .max(200, "Please use 200 characters or fewer.")
    .refine(
      (value) =>
        z.email().safeParse(value).success ||
        contactDetails.shape.phone.safeParse(value).success,
      "Please enter a valid email address or phone number.",
    )
    .transform((value) =>
      contactDetails.shape.phone.safeParse(value).success
        ? normalizeDigits(value).replace(/[\s().-]/g, "")
        : value,
    ),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
});
