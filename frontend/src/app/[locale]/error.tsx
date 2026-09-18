"use client";
import { useParams } from "next/navigation";
import { asLocale } from "@/i18n";
import { t } from "@/i18n";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = asLocale(String(useParams().locale ?? "en"));
  return (
    <section className="container not-found">
      <p className="eyebrow">{t(locale, "Something interrupted the visit")}</p>
      <h1>{t(locale, "Let’s try that again.")}</h1>
      <p>
        {t(locale, "We couldn’t load this page. Please retry in a moment.")}
      </p>
      <button className="button" onClick={reset}>
        {t(locale, "Try again")}
      </button>
    </section>
  );
}
