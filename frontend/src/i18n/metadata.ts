import type { Metadata } from "next";
import { localizedHref, t, type Locale } from "./index";
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title: path === "/" ? { absolute: t(locale, title) } : t(locale, title),
    description: t(locale, description),
    alternates: {
      canonical: localizedHref(locale, path),
      languages: {
        en: localizedHref("en", path),
        fa: path,
        "x-default": path,
      },
    },
    openGraph: {
      title: t(locale, title),
      description: t(locale, description),
      url: localizedHref(locale, path),
      locale: locale === "fa" ? "fa_IR" : "en_US",
      alternateLocale: locale === "fa" ? "en_US" : "fa_IR",
      images: ["/og.png"],
    },
  };
}
