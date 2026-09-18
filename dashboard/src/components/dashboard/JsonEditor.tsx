"use client";

import Button from "@/components/ui/button/Button";
import { useState } from "react";

export default function JsonEditor({ title, value, onSave, saveLabel = "Save changes" }: { title: string; value: unknown; onSave: (value: unknown) => Promise<void>; saveLabel?: string }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    try { setError(""); setSaving(true); await onSave(JSON.parse(text)); }
    catch (e) { setError(e instanceof SyntaxError ? "Enter valid JSON." : e instanceof Error ? e.message : "Unable to save."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-4"><textarea aria-label={title} value={text} onChange={(e) => setText(e.target.value)} className="min-h-120 w-full rounded-lg border border-gray-300 bg-transparent p-4 font-mono text-theme-xs text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90" /><div className="flex items-center gap-4"><Button onClick={submit} disabled={saving}>{saving ? "Saving…" : saveLabel}</Button>{error && <p role="alert" className="text-theme-sm text-error-500">{error}</p>}</div></div>;
}
