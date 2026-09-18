import { forwardPublic } from "@/lib/api-proxy";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export function GET(){return forwardPublic("/availability");}
