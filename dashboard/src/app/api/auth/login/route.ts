import { NextResponse } from "next/server";

const baseUrl = process.env.CODEVERA_API_URL ?? "http://127.0.0.1:4000/api/v1";

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch(`${baseUrl}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body,
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  const response = NextResponse.json({ user: data.user, expiresAt: data.expiresAt });
  response.cookies.set("codevera_admin_session", data.accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", expires: new Date(data.expiresAt),
  });
  return response;
}
