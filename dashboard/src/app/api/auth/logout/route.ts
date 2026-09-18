import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const baseUrl = process.env.CODEVERA_API_URL ?? "http://127.0.0.1:4000/api/v1";
export async function POST() {
  const token = (await cookies()).get("codevera_admin_session")?.value;
  if (token) await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete("codevera_admin_session");
  return response;
}
