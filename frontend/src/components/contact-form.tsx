"use client";
import { t, type LocaleProps } from "@/i18n";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { messageSchema } from "@/lib/validation";
export function ContactForm({ locale = "en" }: LocaleProps) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    const result = messageSchema.safeParse(values);
    if (!result.success) {
      setStatus(result.error.issues[0].message);
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, locale }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess(true);
      setStatus(data.message);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : t(locale, "Something went wrong. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="form-success" role="status">
        <Check size={32} />
        <h2>{t(locale, "Thank you for the introduction.")}</h2>
        <p>{t(locale, status)}</p>
        <button
          className="text-link"
          onClick={() => {
            setSuccess(false);
            setStatus("");
          }}
        >
          {t(locale, "Write another message")}
          <ArrowUpRight size={16} />
        </button>
      </div>
    );
  return (
    <form onSubmit={submit} className="contact-form" noValidate>
      <h2>{t(locale, "Tell us a little about it.")}</h2>
      <p>
        {t(
          locale,
          "A brief outline is a good start. We can work through the details together.",
        )}
      </p>
      <label htmlFor="contact-name">{t(locale, "Your name")}</label>
      <input
        id="contact-name"
        name="name"
        placeholder={t(locale, "Full name")}
        autoComplete="name"
        required
        minLength={2}
        maxLength={100}
      />
      <label htmlFor="contact-details">
        {t(locale, "Email or phone number")}
      </label>
      <input
        id="contact-details"
        dir="auto"
        name="contact"
        placeholder={t(locale, "Where we can reach you")}
        required
        maxLength={200}
      />
      <label htmlFor="contact-message">
        {t(locale, "What are you thinking?")}
      </label>
      <textarea
        id="contact-message"
        dir="auto"
        name="message"
        rows={5}
        placeholder={t(
          locale,
          "A new website, a redesign, a custom application…",
        )}
        required
        minLength={10}
        maxLength={5000}
      />
      <p className="form-note">
        {t(
          locale,
          "Messages are stored locally. Email delivery is not connected yet.",
        )}
      </p>
      {status && (
        <p className="form-error" role="alert">
          {t(locale, status)}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? t(locale, "Saving your message…")
          : t(locale, "Save your message")}
        <ArrowUpRight size={16} />
      </button>
      <p className="form-note">
        {t(locale, "Your details are used only to discuss your enquiry.")}{" "}
        <a href="#privacy">{t(locale, "About your information")}</a>
      </p>
    </form>
  );
}
