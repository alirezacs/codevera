"use client";
import { useParams } from "next/navigation";
import { asLocale } from "@/i18n";
import { t } from "@/i18n";
import { ButtonLink, Eyebrow } from "@/components/ui";
export default function NotFound() {
  const locale = asLocale(String(useParams().locale ?? "en"));
  return (
    <section className="container not-found">
      <Eyebrow>{t(locale, "404 / A small detour")}</Eyebrow>
      <h1>
        {t(locale, "This page is")}
        <br />
        <em>{t(locale, "off the drawing board.")}</em>
      </h1>
      <p>
        {t(
          locale,
          "The address may have changed, or the page doesn’t exist. Let’s get you somewhere useful.",
        )}
      </p>
      <ButtonLink locale={locale} href="/">
        {t(locale, "Back to the studio")}
      </ButtonLink>
    </section>
  );
}
