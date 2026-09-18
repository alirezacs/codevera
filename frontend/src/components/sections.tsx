import { number, t, type LocaleProps } from "@/i18n";
import { services, processSteps } from "@/config/site";
import { Eyebrow, TextLink } from "./ui";
import { ArrowUpRight } from "lucide-react";
export function Services({ locale = "en" }: LocaleProps) {
  return (
    <section id="services" className="services-section section">
      <div className="container split-section">
        <div className="section-intro">
          <Eyebrow>{t(locale, "What we do")}</Eyebrow>
          <h2>
            {t(locale, "Good design.")}
            <br />
            {t(locale, "Solid foundations.")}
          </h2>
          <p>
            {t(
              locale,
              "From a first impression to a complex interaction, we look after the whole experience.",
            )}
          </p>
          <TextLink locale={locale} href="/contact">
            {t(locale, "Find the right approach")}
          </TextLink>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <article key={t(locale, service.title)}>
              <span className="item-index">
                {number(locale, index + 1).padStart(
                  2,
                  locale === "fa" ? "۰" : "0",
                )}
              </span>
              <div>
                <h3>{t(locale, service.title)}</h3>
                <p>{t(locale, service.text)}</p>
                <span className="service-tags">{t(locale, service.tags)}</span>
              </div>
              <ArrowUpRight size={20} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Process({ locale = "en" }: LocaleProps) {
  return (
    <section className="section process-section">
      <div className="container">
        <div className="section-heading">
          <div>
            <Eyebrow>{t(locale, "How we work")}</Eyebrow>
            <h2>
              {t(locale, "A clear process.")}
              <br />
              <em>{t(locale, "No guesswork.")}</em>
            </h2>
          </div>
          <p>
            {t(locale, "Good work comes from good collaboration.")}
            <br />
            {t(locale, "You’ll know what’s happening, why it matters,")}
            <br />
            {t(locale, "and what comes next.")}
          </p>
        </div>
        <div className="process-grid">
          {processSteps.map(([title, description], index) => (
            <article key={t(locale, title)}>
              <span className="process-number">
                {number(locale, index + 1).padStart(
                  2,
                  locale === "fa" ? "۰" : "0",
                )}
              </span>
              <h3>{t(locale, title)}</h3>
              <p>{t(locale, description)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
