import { getFounders } from "@/lib/backend";
import Image from "next/image";
import { founderSection } from "@/data/founders";
import type { LocaleProps } from "@/i18n";
import { Eyebrow, TextLink } from "./ui";
import { Mark } from "./brand";
export async function Founders({ locale = "en" }: LocaleProps) {
  const copy = founderSection[locale];
  const founders = await getFounders();
  return (
    <section id="founders" className="founders-section section">
      <div className="container">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2>
              {copy.title}
              <br />
              <em>{copy.emphasis}</em>
            </h2>
          </div>
          <p>{copy.description}</p>
        </div>
        {founders.length ? (
          <div className="founders-grid">
            {founders.map((founder) => (
              <article className="founder-profile" key={founder.id}>
                {founder.portrait ? (
                  <Image
                    className="founder-portrait"
                    src={founder.portrait.src}
                    alt={founder.portrait.alt[locale]}
                    width={640}
                    height={720}
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                ) : (
                  <div
                    className="founder-portrait founder-initials"
                    aria-label={copy.placeholder}
                  >
                    <span>
                      {founder.name[locale]
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join(" ")}
                    </span>
                  </div>
                )}
                <div className="founder-details">
                  <p className="eyebrow">{founder.role[locale]}</p>
                  <h3>{founder.name[locale]}</h3>
                  <p>{founder.bio[locale]}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="founders-introduction">
            <div className="founders-seal" aria-hidden="true">
              <Mark />
              <span>CODEVERA / STUDIO</span>
            </div>
            <div>
              <p>{copy.pending}</p>
              <TextLink href="/#consultation" locale={locale}>
                {copy.cta}
              </TextLink>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
