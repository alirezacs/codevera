import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/fa" || pathname.startsWith("/fa/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/"))
    return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/fa${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}
export const config = { matcher: ["/((?!api(?:/|$)|_next/|.*\\.[^/]+$).*)"] };
