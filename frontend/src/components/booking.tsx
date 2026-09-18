"use client";
import { number, displayTime, t, type LocaleProps, type Locale } from "@/i18n";
import { LocalizedLink as Link } from "@/i18n/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Globe2,
  Video,
} from "lucide-react";
import { Eyebrow } from "./ui";
import { contactDetails } from "@/lib/validation";
import { endTime } from "@/lib/time";
import type { Schedule } from "@/config/availability";
type Day = { date: string; slots: string[] };
type Reservation = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
};
function formatDate(
  locale: Locale,
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function Booking({ locale = "en", schedule }: LocaleProps & {schedule:Schedule}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Reservation | null>(null);
  const [review, setReview] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const view = `${step}-${review}`;
  const previousStep = useRef(view);
  useEffect(() => {
    if (previousStep.current !== view) {
      heading.current?.focus();
      previousStep.current = view;
    }
  }, [view]);
  async function loadDates() {
    setLoading(true);
    try {
      const response = await fetch("/api/availability", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDays(result.dates);
      setDate((current) =>
        result.dates.some(
          (day: Day) => day.date === current && day.slots.length,
        )
          ? current
          : result.dates.find((day: Day) => day.slots.length)?.date || "",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(locale, "Couldn’t load available times."),
      );
    } finally {
      setLoading(false);
    }
  }
  async function continueBooking(event: React.FormEvent) {
    event.preventDefault();
    const result = contactDetails.safeParse({ name, phone });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setName(result.data.name);
    setPhone(result.data.phone);
    setError("");
    setStep(2);
    await loadDates();
  }
  async function confirmBooking() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, date, startTime: time, locale }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setTime("");
          setReview(false);
          await loadDates();
        }
        throw new Error(result.error);
      }
      setBooking(result.booking);
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(locale, "Something went wrong. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }
  const selectedDay = days.find((day) => day.date === date);
  return (
    <section id="consultation" className="booking-section section">
      <div className="container booking-grid">
        <div className="booking-intro">
          <Eyebrow>{t(locale, "Let’s talk about your project")}</Eyebrow>
          <h2>
            {t(locale, "A fresh perspective.")}
            <br />
            <em>{t(locale, "On the house.")}</em>
          </h2>
          <p>
            {t(
              locale,
              "Have an idea, a challenge, or a website that could be doing more? Let’s talk it through.",
            )}
          </p>
          <ul className="meeting-details">
            <li>
              <Clock3 size={18} />
              {number(locale, schedule.durationMinutes)}{" "}
              {t(locale, "minutes, entirely free")}
            </li>
            <li>
              <Video size={18} />
              {t(locale, "A conversation, not a sales pitch")}
            </li>
            <li>
              <Globe2 size={18} />
              {t(locale, "All times shown in")} {schedule.timezone}
            </li>
          </ul>
          <div className="meeting-note">
            <span>{t(locale, "WHAT WE’LL COVER")}</span>
            <p>
              {t(
                locale,
                "Your goals, where things stand, and a practical next step. No preparation required.",
              )}
            </p>
          </div>
        </div>
        <div className="booking-panel">
          <div
            className="booking-steps"
            aria-label={t(locale, "Booking progress")}
          >
            {[
              t(locale, "Your details"),
              t(locale, "Choose a time"),
              t(locale, "Confirmed"),
            ].map((label, i) => (
              <span
                key={label}
                className={
                  step === i + 1 ? "active" : step > i + 1 ? "done" : ""
                }
                aria-current={step === i + 1 ? "step" : undefined}
              >
                <b>
                  {step > i + 1 ? (
                    <Check size={12} />
                  ) : (
                    number(locale, i + 1).padStart(
                      2,
                      locale === "fa" ? "۰" : "0",
                    )
                  )}
                </b>
                {label}
              </span>
            ))}
          </div>
          {step === 1 && (
            <form onSubmit={continueBooking} noValidate>
              <span className="eyebrow">
                {t(locale, "A quick introduction")}
              </span>
              <h3 ref={heading} tabIndex={-1}>
                {t(locale, "First, a little about you.")}
              </h3>
              <p>{t(locale, "So we know who we’re meeting.")}</p>
              <label htmlFor="booking-name">
                {t(locale, "Your name")}
                <span aria-hidden="true">*</span>
              </label>
              <input
                id="booking-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t(locale, "Full name")}
                required
                minLength={2}
                maxLength={100}
              />
              <label htmlFor="booking-phone">
                {t(locale, "Phone number")}
                <span aria-hidden="true">*</span>
              </label>
              <input
                id="booking-phone"
                dir="ltr"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 123 4567"
                required
                maxLength={30}
                aria-describedby="phone-hint"
              />
              <p id="phone-hint" className="form-note">
                {t(
                  locale,
                  "Include your country code. We’ll use this only for your consultation.",
                )}
              </p>
              {error && (
                <p className="form-error" role="alert">
                  {t(locale, error)}
                </p>
              )}
              <button className="button booking-next">
                {t(locale, "Choose a time")}
                <ArrowRight size={17} />
              </button>
              <p className="booking-fineprint">
                {t(locale, "No commitment. Just a good starting point.")}
              </p>
            </form>
          )}
          {step === 2 && (
            <div>
              <h3 ref={heading} tabIndex={-1}>
                {review
                  ? t(locale, "A quick look before we book.")
                  : t(locale, "Find a time that suits you.")}
              </h3>
              <p>
                {review
                  ? t(locale, "Check your details, then make it official.")
                  : locale === "fa"
                    ? `${number(locale, schedule.durationMinutes)} دقیقه · ${schedule.timezone} · ${number(locale, schedule.advanceDays)} روز آینده`
                    : `${schedule.durationMinutes} minutes · ${schedule.timezone} · Next ${schedule.advanceDays} days`}
              </p>
              {loading ? (
                <p role="status" className="loading-state">
                  {t(locale, "Finding available times…")}
                </p>
              ) : review ? (
                <div className="booking-review">
                  <dl>
                    <div>
                      <dt>{t(locale, "Your name")}</dt>
                      <dd>{name}</dd>
                    </div>
                    <div>
                      <dt>{t(locale, "Consultation date")}</dt>
                      <dd>{formatDate(locale, date)}</dd>
                    </div>
                    <div>
                      <dt>{t(locale, "Time")}</dt>
                      <dd>
                        <bdi dir="ltr">
                          {displayTime(locale, time)}–
                          {displayTime(locale, endTime(time, schedule.durationMinutes))}{" "}
                          {schedule.timezone}
                        </bdi>
                      </dd>
                    </div>
                  </dl>
                  <p className="form-note">
                    {t(
                      locale,
                      "This reserves your time in the website. Email and calendar notifications are not connected yet.",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="calendar-title">
                    {days[0] &&
                      formatDate(locale, days[0].date, {
                        month: "long",
                        year: "numeric",
                      })}
                    <span>
                      →{" "}
                      {days.at(-1) &&
                        formatDate(locale, days.at(-1)!.date, {
                          month: "short",
                          day: "numeric",
                        })}
                    </span>
                  </div>
                  <div className="calendar-weekdays" aria-hidden="true">
                    {(locale === "fa"
                      ? ["ش", "ی", "د", "س", "چ", "پ", "ج"]
                      : ["S", "M", "T", "W", "T", "F", "S"]
                    ).map((day, i) => (
                      <span key={i}>{day}</span>
                    ))}
                  </div>
                  <div
                    className="calendar-grid"
                    role="group"
                    aria-label={t(locale, "Available consultation dates")}
                  >
                    {days.length > 0 &&
                      Array.from(
                        {
                          length:
                            (new Date(`${days[0].date}T12:00:00Z`).getUTCDay() +
                              (locale === "fa" ? 1 : 0)) %
                            7,
                        },
                        (_, i) => <span key={`blank-${i}`} />,
                      )}
                    {days.map((day) => (
                      <button
                        key={day.date}
                        className={date === day.date ? "selected" : ""}
                        disabled={!day.slots.length}
                        aria-label={formatDate(locale, day.date)}
                        aria-pressed={date === day.date}
                        onClick={() => {
                          setDate(day.date);
                          setTime("");
                          setError("");
                        }}
                      >
                        {formatDate(locale, day.date, { day: "numeric" })}
                      </button>
                    ))}
                  </div>
                  {!days.some((day) => day.slots.length) ? (
                    <p className="empty-state">
                      {t(locale, "There are no available times in the next")}{" "}
                      {number(locale, schedule.advanceDays)}{" "}
                      {t(locale, "days.")}{" "}
                      <Link locale={locale} href="/contact">
                        {t(locale, "Send us a message instead.")}
                      </Link>
                    </p>
                  ) : (
                    <>
                      <p className="slot-label">
                        {date &&
                          formatDate(locale, date, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                        <span>
                          {t(locale, "Available times ·")} {schedule.timezone}
                        </span>
                      </p>
                      <div
                        className="time-slots"
                        role="group"
                        aria-label={t(locale, "Available times")}
                      >
                        {selectedDay?.slots.map((slot) => (
                          <button
                            key={displayTime(locale, slot)}
                            className={time === slot ? "selected" : ""}
                            aria-pressed={time === slot}
                            onClick={() => {
                              setTime(slot);
                              setError("");
                            }}
                          >
                            {displayTime(locale, slot)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {t(locale, error)}
                </p>
              )}
              {!loading && days.length === 0 && (
                <button
                  className="text-link"
                  onClick={() => {
                    setError("");
                    void loadDates();
                  }}
                >
                  {t(locale, "Retry availability")}
                </button>
              )}
              <div className="booking-controls">
                <button
                  className="back-button"
                  disabled={busy}
                  onClick={() => {
                    if (review) setReview(false);
                    else setStep(1);
                    setError("");
                  }}
                >
                  {t(locale, "Back")}
                </button>
                {review ? (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={confirmBooking}
                  >
                    {busy
                      ? t(locale, "Reserving…")
                      : t(locale, "Confirm consultation")}
                    <Check size={16} />
                  </button>
                ) : (
                  <button
                    className="button"
                    disabled={!time || loading}
                    onClick={() => setReview(true)}
                  >
                    {t(locale, "Review booking")}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          {step === 3 && booking && (
            <div className="booking-success" role="status">
              <div className="success-mark">
                <Check size={30} />
              </div>
              <h3 ref={heading} tabIndex={-1}>
                {t(locale, "A good beginning,")} {booking.name.split(" ")[0]}.
              </h3>
              <p>{t(locale, "Your consultation is reserved.")}</p>
              <div className="confirmed-time">
                <strong>{formatDate(locale, booking.date)}</strong>
                <span>
                  <bdi dir="ltr">
                    {displayTime(locale, booking.startTime)}–
                    {displayTime(locale, booking.endTime)} {schedule.timezone}
                  </bdi>
                </span>
              </div>
              <p className="form-note">
                {t(
                  locale,
                  "Save these details. Your reservation is stored on this website; no email or calendar invitation has been sent.",
                )}
              </p>
              <Link locale={locale} className="text-link" href="/portfolio">
                {t(locale, "Get to know our approach")}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
