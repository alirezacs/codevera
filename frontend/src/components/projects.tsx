import { number, displayTime, t, type LocaleProps } from "@/i18n";
import Image from "next/image";
import { LocalizedLink as Link } from "@/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/data/projects";
export function ProjectGrid({
  projects,
  locale = "en",
}: { projects: Project[] } & LocaleProps) {
  return projects.length ? (
    <div className="project-grid">
      {projects.map((project, index) => (
        <article className="project" key={project.slug}>
          <Link
            locale={locale}
            href={`/portfolio/${project.slug}`}
            className="project-image"
            aria-label={
              locale === "fa"
                ? `مشاهده پروژه ${project.title}`
                : `View ${project.title} case study`
            }
          >
            <Image
              src={project.featuredImage}
              alt={
                locale === "fa"
                  ? `${project.title} — ${project.demo ? "طرح مفهومی" : "نمای وب‌سایت"}`
                  : `${project.title} — website ${project.demo ? "concept" : "overview"}`
              }
              width={1000}
              height={760}
              sizes="(max-width: 700px) 100vw, 50vw"
            />
            <span className="project-open">
              <ArrowUpRight size={22} />
            </span>
            <span className="project-number">
              {number(locale, index + 1).padStart(
                2,
                locale === "fa" ? "۰" : "0",
              )}
            </span>
          </Link>
          <div className="project-meta">
            <span>{project.category}</span>
            <span>
              {project.demo ? t(locale, "Concept ·") + " " : ""}
              {displayTime(locale, project.year)}
            </span>
          </div>
          <Link
            locale={locale}
            href={`/portfolio/${project.slug}`}
            className="project-title"
          >
            <h3>{project.title}</h3>
            <ArrowUpRight size={22} />
          </Link>
          <p>{project.shortDescription}</p>
          <Link
            locale={locale}
            href={`/portfolio/${project.slug}`}
            className="project-detail-link"
          >
            {t(locale, "View details")}
            <span aria-hidden="true">↗</span>
          </Link>
        </article>
      ))}
    </div>
  ) : (
    <p className="empty-state">
      {t(locale, "Our project collection is being updated.")}{" "}
      <Link locale={locale} href="/contact">
        {t(locale, "Talk with us about your project.")}
      </Link>
    </p>
  );
}
