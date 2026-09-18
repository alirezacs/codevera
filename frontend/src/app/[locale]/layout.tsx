import { Suspense } from "react";
import { LoadingState } from "@/components/loading-state";
import { getCompany } from "@/lib/backend";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { asLocale, locales, t, type PageProps } from "@/i18n";
import type { Metadata } from "next";
import { DM_Sans, Manrope, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/config/site";
import "../globals.css";
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Manrope({ subsets: ["latin"], variable: "--font-display" });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const vazir = localFont({
  src: [
    {
      path: "../../../public/fonts/Vazir-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazir-Medium.woff2",
      weight: "500 800",
      style: "normal",
    },
  ],
  variable: "--font-vazir",
  display: "swap",
});
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const company = await getCompany();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: t(
        locale,
        "Codevera — Thoughtful design. Dependable development.",
      ),
      template: locale === "fa" ? "%s | کدورا" : "%s | Codevera",
    },
    description: company.description[locale],
    icons: { icon: "/icon.svg" },
    openGraph: {
      type: "website",
      siteName: company.name[locale],
      locale: locale === "fa" ? "fa_IR" : "en_US",
      alternateLocale: locale === "fa" ? "en_US" : "fa_IR",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}
export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode }> & PageProps) {
  const { locale: value } = await params;
  if (!locales.includes(value as "en" | "fa")) notFound();
  const locale = asLocale(value);
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body
        className={`${sans.variable} ${display.variable} ${serif.variable} ${vazir.variable}`}
      >
        <a className="skip-link" href="#main">
          {t(locale, "Skip to content")}
        </a>
        <Header locale={locale} />
        <main id="main">{children}</main>
        <Suspense fallback={<LoadingState footer />}>
          <Footer locale={locale} />
        </Suspense>
      </body>
    </html>
  );
}
