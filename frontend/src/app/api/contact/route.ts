import { forwardPublic } from "@/lib/api-proxy";
import { messageSchema } from "@/lib/validation";
import { readBody, safeError } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){let body:unknown;try{body=await readBody(request);}catch{return safeError("Please send a valid message request.");}const parsed=messageSchema.safeParse(body);if(!parsed.success)return safeError(parsed.error.issues[0].message);return forwardPublic("/contact",parsed.data);}
