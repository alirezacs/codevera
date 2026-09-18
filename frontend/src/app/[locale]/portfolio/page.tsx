import { pageMetadata } from "@/i18n/metadata";
import { asLocale, type PageProps } from "@/i18n";
import { number, t } from "@/i18n";
import type { Metadata } from "next";
import { Eyebrow, FinalCTA } from "@/components/ui";
import { ProjectGrid } from "@/components/projects";
import { getProjects } from "@/lib/backend";
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return pageMetadata(
    locale,
    "/portfolio",
    "Selected work",
    "Explore Codevera’s approach to architecture websites, commerce experiences, and custom web applications.",
  );
}
export default async function Portfolio({ params }: PageProps) {
  const locale = asLocale((await params).locale);
  const projects = await getProjects(locale);
  return (
    <>
      <section className="page-heading container">
        <Eyebrow>{t(locale, "The portfolio")}</Eyebrow>
        <h1>
          {t(locale, "Considered work.")}
          <br />
          <em>{t(locale, "Built around real needs.")}</em>
        </h1>
        <div className="page-heading-bottom">
          <p>
            {t(
              locale,
              "A closer look at how we bring clarity, character, and craftsmanship to the web.",
            )}
          </p>
          <span className="eyebrow">
            {number(locale, projects.length).padStart(
              2,
              locale === "fa" ? "۰" : "0",
            )}
            {t(locale, "projects / All disciplines")}
          </span>
        </div>
      </section>
      <section className="container portfolio-collection">
        {projects.some((project) => project.demo) && (
          <p className="demo-note">
            {t(
              locale,
              "Entries labeled “Concept” are illustrative studies, created to show our approach.",
            )}
          </p>
        )}
        <ProjectGrid locale={locale} projects={projects} />
      </section>
      <FinalCTA locale={locale} />
    </>
  );
}
