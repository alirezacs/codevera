import fa from "./fa.json";
export type Locale = "en" | "fa";
export type LocaleProps = { locale?: Locale };
export type PageProps = { params: Promise<{ locale: string }> };
export const locales = ["en", "fa"] as const;
export function asLocale(value: string): Locale {
  return value === "fa" ? "fa" : "en";
}
export function t(locale: Locale, text: string): string {
  return locale === "fa"
    ? ((fa as Record<string, string>)[text] ?? text)
    : text;
}
export function localizedHref(locale: Locale, href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return locale === "en" ? `/en${href === "/" ? "" : href}` : href;
}
export function number(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en", {
    useGrouping: false,
  }).format(value);
}
export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)),
  );
}

export function displayTime(locale: Locale, value: string) {
  return locale === "fa"
    ? value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
    : value;
}
