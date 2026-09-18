import type { Locale } from "@/i18n";
export type Founder = {
  id: string;
  name: Record<Locale, string>;
  role: Record<Locale, string>;
  bio: Record<Locale, string>;
  portrait?: { src: string; alt: Record<Locale, string> };
};
export const founderSection = {
  en: {
    eyebrow: "The founders",
    title: "The people behind",
    emphasis: "the studio.",
    description: "A closer introduction to the people who started Codevera.",
    pending:
      "We’re preparing our founders’ profiles. Until then, the best way to get to know us is through a conversation.",
    cta: "Get to know us",
    placeholder: "Founder portrait coming soon",
  },
  fa: {
    eyebrow: "بنیان‌گذاران",
    title: "بنیان‌گذارانِ",
    emphasis: "کدورا.",
    description: "آشنایی نزدیک‌تر با کسانی که کدورا را پایه‌گذاری کردند.",
    pending:
      "در حال آماده‌سازی معرفی بنیان‌گذاران هستیم. تا آن زمان، بهترین راه آشنایی با ما یک گفتگوی ساده است.",
    cta: "بیشتر با ما آشنا شوید",
    placeholder: "تصویر بنیان‌گذار به‌زودی",
  },
};
