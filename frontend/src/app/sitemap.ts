import type { MetadataRoute } from "next";
import { localizedHref, locales } from "@/i18n";
import { site } from "@/config/site";
import { getProjects } from "@/lib/backend";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects("en");
  const paths = [
    "/",
    "/portfolio",
    "/about",
    "/contact",
    ...projects.map((project) => `/portfolio/${project.slug}`),
  ];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${site.url}${localizedHref(locale, path)}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: {
          en: `${site.url}${localizedHref("en", path)}`,
          fa: `${site.url}${path}`,
        },
      },
    })),
  );
}
