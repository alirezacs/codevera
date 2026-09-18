"use client";

import { useParams, usePathname } from "next/navigation";
import { asLocale, t } from "@/i18n";

export function LoadingState({ footer = false }: { footer?: boolean }) {
  const locale = asLocale(String(useParams().locale ?? "en"));
  const pathname = usePathname().replace(/^\/(fa|en)(?=\/|$)/, "") || "/";
  const kind =
    pathname === "/"
      ? "home"
      : pathname.includes("/portfolio/")
        ? "detail"
        : pathname === "/portfolio"
          ? "portfolio"
          : pathname === "/contact"
            ? "contact"
            : "about";
  return (
    <section
      className={`content-loading ${footer ? "footer-loading" : "container loading-" + kind}`}
      data-testid={footer ? "footer-loading" : "page-loading"}
      aria-busy="true"
      aria-label={t(locale, "Loading content")}
    >
      <p className="loading-caption" role="status">
        <span className="loading-dot" aria-hidden="true" />
        {t(locale, "A moment for the details.")}
      </p>
      <div className="loading-shapes" aria-hidden="true">
        {footer ? (
          <div className="loading-columns">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="skeleton skeleton-label" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="loading-heading">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-title short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
            </div>
            <div className="loading-panels">
              {Array.from(
                {
                  length:
                    kind === "portfolio"
                      ? 3
                      : kind === "detail" || kind === "home"
                        ? 1
                        : 2,
                },
                (_, i) => (
                  <div className="loading-card" key={i}>
                    <div className="skeleton skeleton-image" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
