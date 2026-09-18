export type ApiError = Error & { status?: number };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(body?.message || "The request could not be completed.") as ApiError;
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const json = (method: "POST" | "PUT" | "PATCH", body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
