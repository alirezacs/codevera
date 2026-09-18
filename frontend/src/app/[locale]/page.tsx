import { pageMetadata } from "@/i18n/metadata";
import { asLocale, type PageProps } from "@/i18n";
import { t } from "@/i18n";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { Eyebrow, ButtonLink, TextLink, FinalCTA } from "@/components/ui";
import { ProjectGrid } from "@/components/projects";
import { Services, Process } from "@/components/sections";
import { Booking } from "@/components/booking";
import { Mark } from "@/components/brand";
import { getCompany, getSchedule, getProjects } from "@/lib/backend";
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const company = await getCompany();
  return pageMetadata(
    locale,
    "/",
    "Codevera — Thoughtful design. Dependable development.",
    company.description[locale],
  );
}
export default async function Home({ params }: PageProps) {
  const locale = asLocale((await params).locale);
  const [projects, schedule] = await Promise.all([
    getProjects(locale),
    getSchedule(),
  ]);
  return (
    <>
      <section className="hero container">
        <div className="hero-topline">
          <Eyebrow>
            {t(locale, "Independent design & development studio")}
          </Eyebrow>
          <span className="availability-badge">
            <i />
            {t(locale, "Open to new projects")}
          </span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>
              {t(locale, "Built with purpose.")}
              <br />
              {t(locale, "Designed to")}
              <br />
              <em>{t(locale, "make a difference.")}</em>
            </h1>
            <p>
              {t(
                locale,
                "We design and develop considered websites for businesses that care about how they show up.",
              )}
            </p>
            <div className="hero-actions">
              <ButtonLink locale={locale} href="#consultation">
                {t(locale, "Book a free consultation")}
              </ButtonLink>
              <TextLink locale={locale} href="/portfolio">
                {t(locale, "Explore our work")}
              </TextLink>
            </div>
            <div className="hero-note">
              <span className="small-line" />
              {t(
                locale,
                "A thoughtful partner, from first idea to final detail.",
              )}
            </div>
          </div>
          <div className="hero-art">
            <div className="art-caption">
              <span>{t(locale, "THE INTERSECTION OF")}</span>
              <span>{t(locale, "DESIGN + ENGINEERING")}</span>
            </div>
            <div className="art-orbit" />
            <div className="art-window">
              <div className="browser-bar">
                <span />
                <span />
                <span />
                <p>{t(locale, "forma.studio — concept")}</p>
                <ArrowUpRight size={10} />
              </div>
              <Image
                src="/projects/forma.svg"
                alt={t(
                  locale,
                  "Forma architecture concept: a carefully composed editorial website with a sculptural architectural illustration",
                )}
                width={1000}
                height={760}
                priority
                sizes="(max-width: 800px) 90vw, 45vw"
              />
            </div>
            <div className="art-stamp">
              <Mark />
              <span>
                {t(locale, "THOUGHTFULLY DESIGNED")}
                <br />
                {t(locale, "CAREFULLY ENGINEERED")}
              </span>
            </div>
            <span className="art-coordinate">
              {t(locale, "CV / SELECTED PERSPECTIVE — 01")}
            </span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            {t(locale, "Made for your business. Built for what’s next.")}
          </span>
          <a href="#work">
            {t(locale, "A closer look")}
            <ArrowDown size={15} />
          </a>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          {[
            t(locale, "Strategy before screens"),
            t(locale, "Design with intention"),
            t(locale, "Development with care"),
            t(locale, "A partner beyond launch"),
          ].map((text) => (
            <span key={text}>
              <Check size={15} />
              {text}
            </span>
          ))}
        </div>
      </div>
      <section id="work" className="section container work-section">
        <div className="section-heading">
          <div>
            <Eyebrow>{t(locale, "A selection of possibilities")}</Eyebrow>
            <h2>
              {t(locale, "Different ambitions.")}
              <br />
              <em>{t(locale, "The same attention to detail.")}</em>
            </h2>
          </div>
          <TextLink locale={locale} href="/portfolio">
            {t(locale, "View all projects")}
          </TextLink>
        </div>
        {projects.some((project) => project.demo) && (
          <p className="demo-note">
            {t(
              locale,
              "Entries labeled “Concept” are illustrative studies, created to show our approach.",
            )}
          </p>
        )}
        <ProjectGrid
          locale={locale}
          projects={projects.filter((project) => project.featured)}
        />
      </section>
      <section className="studio-section section">
        <div className="container studio-grid">
          <div>
            <Eyebrow>{t(locale, "The studio")}</Eyebrow>
            <h2>
              {t(locale, "Small details.")}
              <br />
              <em>{t(locale, "A lasting impression.")}</em>
            </h2>
          </div>
          <div>
            <p className="large-copy">
              {t(
                locale,
                "Your website should feel like your business at its best. Clear in what it says. Confident in how it looks. Reliable in how it works.",
              )}
            </p>
            <p>
              {t(
                locale,
                "At Codevera, design and development are part of the same conversation. We bring both together to build websites that are considered from the inside out.",
              )}
            </p>
            <TextLink locale={locale} href="/about">
              {t(locale, "A little more about us")}
            </TextLink>
          </div>
        </div>
      </section>
      <Services locale={locale} />
      <Process locale={locale} />
      <Booking schedule={schedule} locale={locale} />
      <FinalCTA locale={locale} />
    </>
  );
}
