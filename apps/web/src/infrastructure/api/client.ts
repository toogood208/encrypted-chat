export const API_BASE = "https://whisperbox.koyeb.app";

import { tokenStorage } from "../../domain/session/tokens";
import { cryptoSession } from "../../domain/session/cryptoSession";
import { useAuthStore } from "../../features/auth/state/authStore";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

let isHandlingUnauthorized = false;
let refreshInFlight: Promise<string | null> | null = null;

interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

function handleUnauthorized(): void {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;

  tokenStorage.clear();
  cryptoSession.clear();
  useAuthStore.getState().clearAuth();

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

async function refreshAccessToken(signal?: AbortSignal): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal,
    });

    if (!response.ok) return null;
    const data = (await response.json()) as RefreshResponse;
    if (!data.access_token) return null;

    tokenStorage.updateAccess(data.access_token);
    return data.access_token;
  })();

  try {
    return await refreshInFlight;
  } catch {
    return null;
  } finally {
    refreshInFlight = null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit,
  token?: string,
  signal?: AbortSignal,
  retryOnUnauthorized = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal });

  if (!response.ok) {
    if (response.status === 401 && token) {
      if (retryOnUnauthorized) {
        const refreshedToken = await refreshAccessToken(signal);
        if (refreshedToken) {
          return request<T>(path, options, refreshedToken, signal, false);
        }
      }

      handleUnauthorized();
    }

    const body = await response.json().catch(() => ({ detail: response.statusText }));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
          ? body.detail.map((e: { msg: string }) => e.msg).join("; ")
          : "Request failed";
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string, token?: string, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: "GET" }, token, signal);
  },
  post<T>(path: string, body: unknown, token?: string, signal?: AbortSignal): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(body) }, token, signal);
  },
};
