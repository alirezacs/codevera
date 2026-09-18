"use client";
import { t, type LocaleProps } from "@/i18n";
import { LocalizedLink as Link } from "@/i18n/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LanguageSwitch } from "./language-switch";
import { Logo } from "./brand";
import { navigation } from "@/config/site";
export function Header({ locale = "en" }: LocaleProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname().replace(/^\/en(?=\/|$)/, "") || "/";
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo locale={locale} />
        <nav aria-label={t(locale, "Main navigation")} className="desktop-nav">
          {navigation.map((item) => (
            <Link
              locale={locale}
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {t(locale, item.label)}
            </Link>
          ))}
        </nav>
        <Link locale={locale} href="/#consultation" className="header-cta">
          {t(locale, "Book consultation")}
          <ArrowUpRight size={16} />
        </Link>
        <LanguageSwitch locale={locale} />
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-label={
            open ? t(locale, "Close navigation") : t(locale, "Open navigation")
          }
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-nav"
          aria-label={t(locale, "Mobile navigation")}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          {navigation.map((item) => (
            <Link
              locale={locale}
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {t(locale, item.label)}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link
            locale={locale}
            href="/#consultation"
            onClick={() => setOpen(false)}
          >
            {t(locale, "Book a consultation")}
            <ArrowUpRight size={18} />
          </Link>
        </nav>
      )}
    </header>
  );
}
