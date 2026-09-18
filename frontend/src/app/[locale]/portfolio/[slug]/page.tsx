import { asLocale, localizedHref } from "@/i18n";
import { pageMetadata } from "@/i18n/metadata";
import { displayTime, t } from "@/i18n";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProjects, getProject } from "@/lib/backend";
import { Eyebrow, FinalCTA, TextLink } from "@/components/ui";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const values = await params;
  const locale = asLocale(values.locale);
  const project = await getProject(values.slug, locale);
  return project
    ? {
        ...pageMetadata(
          locale,
          `/portfolio/${project.slug}`,
          project.title,
          project.shortDescription,
        ),
        title: project.title,
        description: project.shortDescription,

        openGraph: {
          url: localizedHref(locale, `/portfolio/${project.slug}`),
          locale: locale === "fa" ? "fa_IR" : "en_US",
          title: project.title,
          description: project.shortDescription,
          images: [
            project.featuredImage.endsWith(".svg")
              ? "/og.png"
              : project.featuredImage,
          ],
        },
      }
    : { title: "Project not found" };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const values = await params;
  const locale = asLocale(values.locale);
  const project = await getProject(values.slug, locale);
  if (!project) notFound();
  const projects = await getProjects(locale);
  const next =
    projects[
      (projects.findIndex((item) => item.slug === project.slug) + 1) %
        projects.length
    ];
  return (
    <>
      <section className="page-heading container">
        <TextLink locale={locale} href="/portfolio">
          {t(locale, "Back to the collection")}
        </TextLink>
        <div className="case-title">
          <Eyebrow>
            {project.category} /{" "}
            {project.demo
              ? t(locale, "Concept study")
              : t(locale, "Case study")}
          </Eyebrow>
          <h1>
            {project.title}
            <em>.</em>
          </h1>
          <p>{project.shortDescription}</p>
        </div>
      </section>
      <div className="container case-image">
        <Image
          src={project.featuredImage}
          alt={
            locale === "fa"
              ? `${project.title} — نمای وب‌سایت`
              : `${project.title} website ${project.demo ? "concept" : "overview"}`
          }
          width={1000}
          height={760}
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
      </div>
      <section className="section container case-overview">
        <div>
          <Eyebrow>{t(locale, "The brief")}</Eyebrow>
          <h2>
            {t(locale, "A purposeful")}
            <br />
            <em>{t(locale, "digital presence.")}</em>
          </h2>
          <p className="large-copy">{project.description}</p>
        </div>
        <dl>
          <div>
            <dt>{t(locale, "Project type")}</dt>
            <dd>
              {project.projectType ??
                (project.demo
                  ? t(locale, "Independent demonstration concept")
                  : t(locale, "Client project"))}
            </dd>
          </div>
          <div>
            <dt>{t(locale, "Services")}</dt>
            <dd>{project.services.join(" · ")}</dd>
          </div>
          <div>
            <dt>{t(locale, "Technology direction")}</dt>
            <dd>{project.technologies.join(" · ")}</dd>
          </div>
          <div>
            <dt>{t(locale, "Year")}</dt>
            <dd>{displayTime(locale, project.year)}</dd>
          </div>
        </dl>
      </section>
      <section className="case-story container">
        {[
          ["01", t(locale, "The challenge"), project.challenge],
          ["02", t(locale, "Our approach"), project.solution],
          ["03", t(locale, "The outcome"), project.outcome],
        ].map(([number, title, text]) => (
          <article key={number}>
            <span className="eyebrow">{displayTime(locale, number)}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
      {project.gallery && project.gallery.length > 0 && (
        <section
          className="container case-gallery"
          aria-label={t(locale, "Project gallery")}
        >
          {project.gallery.map((image) => (
            <figure key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}
      {projects.length > 1 && (
        <div className="container next-project">
          <span className="eyebrow">{t(locale, "Next in the collection")}</span>
          <TextLink locale={locale} href={`/portfolio/${next.slug}`}>
            {next.title}
          </TextLink>
        </div>
      )}
      <FinalCTA locale={locale} />
    </>
  );
}
