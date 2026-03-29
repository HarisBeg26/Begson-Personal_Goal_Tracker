import { useAuthStore } from "../stores/auth";

const API_URL = import.meta.env.VITE_API_URL as string;

interface ApiError {
  code?: string;
  message?: string;
  details?: unknown;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is missing");
  }

  const authStore = useAuthStore();
  const token = authStore.getAccessToken();

  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errBody: ApiError | null = null;
    try {
      errBody = (await response.json()) as ApiError;
    } catch {
      errBody = null;
    }

    throw new Error(errBody?.message ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}