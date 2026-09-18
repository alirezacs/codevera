import { forwardPublic } from "@/lib/api-proxy";
import { bookingSchema } from "@/lib/validation";
import { readBody, safeError } from "@/lib/http";
export const runtime="nodejs";
export async function POST(request:Request){let body:unknown;try{body=await readBody(request);}catch{return safeError("Please send a valid booking request.");}const parsed=bookingSchema.safeParse(body);if(!parsed.success)return safeError(parsed.error.issues[0].message);return forwardPublic("/bookings",parsed.data);}
