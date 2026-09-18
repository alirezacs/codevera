import type { NextConfig } from "next";

const apiOrigin = (process.env.CODEVERA_API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/api\/v1$/, "");
const nextConfig: NextConfig = { async rewrites() { return [{ source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` }]; } };
export default nextConfig;
