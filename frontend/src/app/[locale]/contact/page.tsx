import { pageMetadata } from "@/i18n/metadata";
import { asLocale, type PageProps } from "@/i18n";
import { displayTime, number, t } from "@/i18n";
import type { Metadata } from "next";
import { Eyebrow, TextLink } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { getCompany, getSchedule } from "@/lib/backend";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return pageMetadata(
    locale,
    "/contact",
    "Let’s talk",
    "Have a website or application in mind? Start a conversation with Codevera or book a free consultation.",
  );
}
export default async function Contact({ params }: PageProps) {
  const locale = asLocale((await params).locale);
  const [company,schedule] = await Promise.all([getCompany(),getSchedule()]);
  return (
    <>
      <section className="page-heading container">
        <Eyebrow>{t(locale, "Start a conversation")}</Eyebrow>
        <h1>
          {t(locale, "Every good project")}
          <br />
          {t(locale, "starts with")} <em>{t(locale, "a conversation.")}</em>
        </h1>
        <p>
          {t(
            locale,
            "No polished brief needed. Tell us where you are and where you’d like to go.",
          )}
        </p>
      </section>
      <section className="container contact-grid">
        <div className="contact-info">
          <Eyebrow>{t(locale, "Get in touch")}</Eyebrow>
          <h2>
            {t(locale, "Let’s find the")}
            <br />
            <em>{t(locale, "right starting point.")}</em>
          </h2>
          <dl>
            <div><dt>{t(locale, "Email")}</dt><dd>{company.emails.map(email => <div key={email}>{company.contactConfigured ? <a href={`mailto:${email}`}><bdi dir="ltr">{email}</bdi></a> : <bdi dir="ltr">{email}</bdi>}</div>)}{!company.contactConfigured && <small>{t(locale,"Example address — real contact details coming soon")}</small>}</dd></div>
            <div><dt>{t(locale,"Phone")}</dt><dd>{company.phones.length ? company.phones.map(phone=><div key={phone}><a href={`tel:${phone}`}><bdi dir="ltr">{phone}</bdi></a></div>) : t(locale,"Phone details coming soon")}</dd></div>
            {company.addresses.map((address,index)=><div key={index}><dt>{address.label[locale]}</dt><dd>{address.address[locale]}{address.mapUrl && <a href={address.mapUrl} target="_blank" rel="noopener noreferrer"> ↗</a>}</dd></div>)}
            <div>
              <dt>{t(locale, "Consultation hours")}</dt>
              <dd>
                {schedule.workingDays.map(day => new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en", {weekday:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2026,8,13+day)))).join(" · ")}{" "}
                <bdi dir="ltr">
                  {displayTime(
                    locale,
                    `${schedule.startHour}:00–${schedule.endHour}:00`,
                  )}{" "}
                  {schedule.timezone}
                </bdi>
              </dd>
            </div>
          </dl>
          <div className="contact-book">
            <h3>{t(locale, "Prefer to talk it through?")}</h3>
            <p>
              {t(locale, "Choose a time for a free,")}{" "}
              {number(locale, schedule.durationMinutes)}
              {locale === "fa" ? " " : ""}
              {t(locale, "-minute introductory conversation.")}
            </p>
            <TextLink locale={locale} href="/#consultation">
              {t(locale, "Book a free consultation")}
            </TextLink>
          </div>
        </div>
        <ContactForm locale={locale} />
      </section>
      <section id="privacy" className="container privacy-section">
        <Eyebrow>{t(locale, "Your information")}</Eyebrow>
        <h2>{t(locale, "A little care goes a long way.")}</h2>
        <p>
          {t(
            locale,
            "Consultation details and messages are stored in this website’s database to manage enquiries. They are not published or sent to a third-party marketing service. No email or calendar notification is sent by this demonstration. Contact details are placeholders until the company’s information is configured. Before public launch, the operator should publish its retention period and an active contact for access or deletion requests.",
          )}
        </p>
      </section>
    </>
  );
}
