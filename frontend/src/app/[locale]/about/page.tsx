import { getTools } from "@/lib/backend";
import { Founders } from "@/components/founders";
import { pageMetadata } from "@/i18n/metadata";
import { asLocale, type PageProps } from "@/i18n";
import { number, t } from "@/i18n";
import type { Metadata } from "next";
import { Eyebrow, FinalCTA, TextLink } from "@/components/ui";
import { Services, Process } from "@/components/sections";
import { Mark } from "@/components/brand";
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return pageMetadata(
    locale,
    "/about",
    "About the studio",
    "Meet Codevera’s approach: a close collaboration between thoughtful design and dependable engineering.",
  );
}
export default async function About({ params }: PageProps) {
  const locale = asLocale((await params).locale);
  const tools = await getTools();
  return (
    <>
      <section className="page-heading container">
        <Eyebrow>{t(locale, "About Codevera")}</Eyebrow>
        <h1>
          {t(locale, "Good people.")}
          <br />
          {t(locale, "Considered work.")}
          <br />
          <em>{t(locale, "Shared ambition.")}</em>
        </h1>
        <div className="page-heading-bottom">
          <p>
            {t(
              locale,
              "A web design and development studio for businesses that believe the details matter.",
            )}
          </p>
          <span className="eyebrow">{t(locale, "Design + Engineering")}</span>
        </div>
      </section>
      <section className="about-manifesto container">
        <div className="brand-panel">
          <Mark />
          <span>{t(locale, "PRECISION IN EVERY PART.")}</span>
        </div>
        <div>
          <Eyebrow>{t(locale, "Our point of view")}</Eyebrow>
          <h2>
            {t(locale, "A website is a working")}
            <br />
            <em>{t(locale, "part of your business.")}</em>
          </h2>
          <p>
            {t(
              locale,
              "It introduces you before a conversation begins. It helps someone understand what you offer. And, when it’s done well, it makes their next step easier.",
            )}
          </p>
          <p>
            {t(
              locale,
              "That’s why we treat the visual experience and the technical foundation with equal care. We work through both together, from the first discussion to the last check before launch.",
            )}
          </p>
          <TextLink locale={locale} href="/contact">
            {t(locale, "Meet us through a conversation")}
          </TextLink>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>{t(locale, "A collaborative studio")}</Eyebrow>
            <h2>
              {t(locale, "One team.")}
              <br />
              <em>{t(locale, "A shared standard.")}</em>
            </h2>
          </div>
          <p>
            {t(
              locale,
              "Codevera brings design and development into one focused process. We value direct conversations, useful feedback, and decisions that can be explained.",
            )}
          </p>
        </div>
        <div className="values-grid">
          {[
            [
              t(locale, "Clarity over complexity"),
              t(
                locale,
                "Every page, interaction, and line of copy should help someone find what they need.",
              ),
            ],
            [
              t(locale, "Care in the details"),
              t(
                locale,
                "Spacing, speed, and accessibility are part of the work, not a final layer.",
              ),
            ],
            [
              t(locale, "Built to be owned"),
              t(
                locale,
                "Maintainable code, practical handovers, and understandable systems give you a sound foundation.",
              ),
            ],
          ].map(([title, text], i) => (
            <article key={title}>
              <span className="eyebrow">
                {number(locale, i + 1).padStart(2, locale === "fa" ? "۰" : "0")}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <Founders locale={locale} />
      <Services locale={locale} />
      <Process locale={locale} />
      <section className="tech-strip container">
        <Eyebrow>{t(locale, "Our working toolkit")}</Eyebrow>
        <p>
          {tools.map((tool, index) => <span className="tool-name" key={tool.id}>{index > 0 && <span aria-hidden="true"> / </span>}{tool.name[locale]}</span>)}
        </p>
        <span>
          {t(
            locale,
            "The right tools for the brief. Never complexity for its own sake.",
          )}
        </span>
      </section>
      <FinalCTA locale={locale} />
    </>
  );
}
