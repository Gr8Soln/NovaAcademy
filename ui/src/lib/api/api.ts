import { useAuthStore } from "@/stores";

export const BASE_URL = "/api/v1";

const api = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  const body = await res.json();
  // All backend responses are { status, message, data }. Unwrap automatically.
  return (body.data ?? body) as T;
};

export default api;
