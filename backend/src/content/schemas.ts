import { z } from "zod";
import {
  assetPath,
  localizedText,
  shortText,
  phoneSchema,
} from "../common/validation";
const projectText = z
  .object({
    title: shortText,
    shortDescription: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(15000),
    category: shortText,
    services: z.array(shortText).max(30),
    challenge: z.string().min(1).max(10000),
    solution: z.string().min(1).max(10000),
    outcome: z.string().min(1).max(10000),
    projectType: shortText.optional(),
    gallery: z
      .array(
        z
          .object({
            src: assetPath,
            alt: shortText,
            width: z.number().int().positive().max(10000),
            height: z.number().int().positive().max(10000),
            caption: shortText.optional(),
          })
          .strict(),
      )
      .max(30)
      .optional(),
  })
  .strict();
const common = {
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  published: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
};
export const projectSchema = z
  .object({
    ...common,
    featured: z.boolean().default(false),
    featuredImage: assetPath,
    year: z.string().regex(/^\d{4}$/),
    demo: z.boolean().default(false),
    technologies: z.array(shortText).max(30),
    translations: z.object({ en: projectText, fa: projectText }).strict(),
  })
  .strict();
export const toolSchema = z
  .object({
    ...common,
    published: z.boolean().default(true),
    name: localizedText,
    description: localizedText.optional(),
    website: z
      .url()
      .refine((v) => v.startsWith("https://"))
      .optional(),
  })
  .strict();
export const founderSchema = z
  .object({
    ...common,
    name: localizedText,
    role: localizedText,
    bio: localizedText,
    portrait: z
      .object({ src: assetPath, alt: localizedText })
      .strict()
      .optional(),
  })
  .strict();
export const contentSchemas = {
  projects: projectSchema,
  tools: toolSchema,
  founders: founderSchema,
};
export const kindSchema = z.enum(["projects", "tools", "founders"]);
export type ContentKind = z.infer<typeof kindSchema>;
export const companySchema = z
  .object({
    name: localizedText,
    description: localizedText,
    location: localizedText,
    contactConfigured: z.boolean(),
    emails: z.array(z.email()).max(10),
    phones: z.array(phoneSchema).max(10),
    addresses: z
      .array(
        z
          .object({
            label: localizedText,
            address: localizedText,
            mapUrl: z
              .url()
              .refine((v) => v.startsWith("https://"))
              .optional(),
          })
          .strict(),
      )
      .max(10),
    socialLinks: z
      .array(
        z
          .object({
            label: shortText,
            url: z.url().refine((v) => v.startsWith("https://")),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();
export type Company = z.infer<typeof companySchema>;
