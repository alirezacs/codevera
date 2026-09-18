import Link from "next/link";
import type { ComponentProps } from "react";
import { localizedHref, type Locale } from "./index";
export function LocalizedLink({
  locale,
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & {
  locale: Locale;
  href: string;
}) {
  return <Link href={localizedHref(locale, href)} {...props} />;
}
