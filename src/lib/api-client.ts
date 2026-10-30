/**
 * CampusOS Backend API Client
 * Base URL: https://campus-os-backend-8sjf.onrender.com
 * Handles authentication headers, tokens, and unified error handling with offline resilience.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://campus-os-backend-8sjf.onrender.com"
).replace(/\/+$/, "");

export const TOKEN_STORAGE_KEY = "campusos:access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  formData?: FormData;
  token?: string;
  timeoutMs?: number;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, formData, token = getStoredToken(), timeoutMs = 12000 } = options;

  const url = `${API_BASE_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (formData) {
    body = formData; // Browser sets multipart/form-data boundary automatically
  } else if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 204) {
      return null as T;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = (data as ApiErrorResponse)?.error;
      throw new ApiError(
        res.status,
        err?.code || `HTTP_${res.status}`,
        err?.message || `Request failed with status ${res.status}`,
        err?.details,
      );
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "The backend server took too long to respond.");
    }
    throw new ApiError(0, "NETWORK_ERROR", "Unable to connect to the backend server.");
  }
}

/** Check if live backend server is reachable */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/openapi.json`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
