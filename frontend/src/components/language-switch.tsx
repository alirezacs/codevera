"use client";
import { usePathname } from "next/navigation";
import { localizedHref, type Locale } from "@/i18n";
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const other = locale === "fa" ? "en" : "fa";
  const plainPath = pathname.replace(/^\/(fa|en)(?=\/|$)/, "") || "/";
  const href = localizedHref(other, plainPath);
  return (
    <a
      className="language-switch"
      href={href}
      hrefLang={other}
      lang={other}
      dir="ltr"
      aria-label={locale === "fa" ? "Switch to English" : "تغییر زبان به فارسی"}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(
          href + window.location.search + window.location.hash,
        );
      }}
    >
      {locale === "fa" ? "EN" : "فارسی"}
    </a>
  );
}
