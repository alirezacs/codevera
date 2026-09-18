import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z } from "zod";
export class Validate<T> implements PipeTransform {
  constructor(private readonly schema: z.ZodType<T>) {}
  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.issues[0].message);
    return parsed.data;
  }
}
export const pagination = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .strict();
export type Pagination = z.infer<typeof pagination>;
export const localizedText = z
  .object({
    en: z.string().trim().min(1).max(10000),
    fa: z.string().trim().min(1).max(10000),
  })
  .strict();
export const shortText = z.string().trim().min(1).max(200);
export const assetPath = z
  .string()
  .max(1000)
  .regex(/^\/(?!\/)[a-zA-Z0-9_./-]+\.(?:png|jpg|jpeg|webp|avif|svg)$/)
  .refine((v) => !v.split("/").includes(".."), "Use a safe local asset path.");
export const localeSchema = z.enum(["en", "fa"]).default("en");
export const normalizeDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)),
  );
export const nameSchema = shortText
  .min(2, "Please enter your full name.")
  .max(100, "Please use 100 characters or fewer.")
  .refine((v) => !/[\x00-\x1f\x7f]/.test(v), "Please use a valid name.");
export const phoneSchema = z
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
      .transform((v) => v.replace(/[\s().-]/g, ""))
      .refine(
        (v) => /^\+?\d{7,15}$/.test(v),
        "Use between 7 and 15 digits, including country code.",
      ),
  );
