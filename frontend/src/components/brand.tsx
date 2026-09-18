import { t, type LocaleProps } from "@/i18n";
import { LocalizedLink as Link } from "@/i18n/link";
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 5H15L4 20l11 15h15l-7-9H19l-5-6 5-6h4z"
        fill="currentColor"
      />
      <path d="m28 14 8 6-8 6-4-6z" fill="currentColor" />
    </svg>
  );
}
export function Logo({ locale = "en" }: LocaleProps) {
  return (
    <Link
      locale={locale}
      href="/"
      className="logo"
      aria-label={t(locale, "Codevera home")}
    >
      <Mark />
      <span>
        codevera<span className="logo-dot">™</span>
      </span>
    </Link>
  );
}
