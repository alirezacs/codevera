import { getCompany } from "@/lib/backend";
import { number, t, type LocaleProps } from "@/i18n";
import { LocalizedLink as Link } from "@/i18n/link";
import { Logo } from "./brand";
import { navigation } from "@/config/site";
import { ArrowUpRight } from "lucide-react";
export async function Footer({ locale = "en" }: LocaleProps) {
  const company = await getCompany();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Logo locale={locale} />
            <p>
              {t(locale, "Thoughtful design.")}
              <br />
              {t(locale, "Dependable development.")}
              <br />
              {t(locale, "A better website for your business.")}
            </p>
          </div>
          <div>
            <span className="footer-label">{t(locale, "Explore")}</span>
            {navigation.map((item) => (
              <Link locale={locale} key={item.href} href={item.href}>
                {t(locale, item.label)}
              </Link>
            ))}
          </div>
          <div>
            <span className="footer-label">{t(locale, "What we do")}</span>
            <Link locale={locale} href="/about#services">
              {t(locale, "Website design")}
            </Link>
            <Link locale={locale} href="/about#services">
              {t(locale, "Web development")}
            </Link>
            <Link locale={locale} href="/about#services">
              {t(locale, "Custom applications")}
            </Link>
            <Link locale={locale} href="/about#services">
              {t(locale, "Refinement & support")}
            </Link>
          </div>
          <div>
            <span className="footer-label">
              {t(locale, "Start a conversation")}
            </span>
            <Link locale={locale} href="/contact" className="footer-contact">
              {t(locale, "Tell us about your project")}
              <ArrowUpRight size={17} />
            </Link>
            <p>{company.location[locale]}</p>
            <Link locale={locale} href="/#consultation">
              {t(locale, "Book a free consultation ↗")}
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {number(locale, new Date().getFullYear())} {company.name[locale]}
            {t(locale, ". All rights reserved.")}
          </span>
          <span>{t(locale, "Designed with intention. Built with care.")}</span>
          <Link locale={locale} href="/contact#privacy">
            {t(locale, "Privacy & your information")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
