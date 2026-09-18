import { t, type LocaleProps, type Locale } from "@/i18n";
import { LocalizedLink as Link } from "@/i18n/link";
import { ArrowUpRight } from "lucide-react";
export function ButtonLink({
  href,
  locale = "en",
  children,
  light = false,
}: {
  href: string;
  locale?: Locale;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      locale={locale}
      href={href}
      className={`button ${light ? "button-light" : ""}`}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function TextLink({
  href,
  locale = "en",
  children,
}: {
  href: string;
  locale?: Locale;
  children: React.ReactNode;
}) {
  return (
    <Link locale={locale} href={href} className="text-link">
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
export function FinalCTA({ locale = "en" }: LocaleProps) {
  return (
    <section className="final-cta container">
      <div>
        <Eyebrow>{t(locale, "A good place to begin")}</Eyebrow>
        <h2>
          {t(locale, "Something in mind?")}
          <br />
          <em>{t(locale, "Let’s make it happen.")}</em>
        </h2>
      </div>
      <ButtonLink locale={locale} href="/#consultation">
        {t(locale, "Book a free consultation")}
      </ButtonLink>
    </section>
  );
}
