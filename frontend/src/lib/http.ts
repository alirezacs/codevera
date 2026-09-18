import { NextResponse } from "next/server";
export function safeError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function readBody(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new Error("ORIGIN");
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("BODY");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 20000) {
      await reader.cancel();
      throw new Error("BODY");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
