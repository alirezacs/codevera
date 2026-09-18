import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const baseUrl = process.env.CODEVERA_API_URL ?? "http://127.0.0.1:4000/api/v1";
async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const token = (await cookies()).get("codevera_admin_session")?.value;
  const url = new URL(request.url);
  const upstream = await fetch(`${baseUrl}/${path.join("/")}${url.search}`, {
    method: request.method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}) },
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
  });
  const body = await upstream.text();
  return new NextResponse(body || null, { status: upstream.status, headers: upstream.headers.get("content-type") ? { "Content-Type": upstream.headers.get("content-type")! } : undefined });
}
export const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy;
