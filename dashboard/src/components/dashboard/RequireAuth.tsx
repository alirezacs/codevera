"use client";

import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api("auth/me").then(() => setReady(true)).catch(() => router.replace("/signin"));
  }, [router]);
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-gray-400">Loading secure dashboard…</div>;
  return <>{children}</>;
}
