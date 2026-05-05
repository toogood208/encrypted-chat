import { apiClient } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
} from "../../shared/types/auth";

export function registerApi(payload: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", payload);
}

export function loginApi(payload: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", payload);
}

export function refreshApi(refreshToken: string): Promise<TokenResponse> {
  return apiClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
}

export function logoutApi(token: string, refreshToken: string): Promise<void> {
  return apiClient.post<void>(
    "/auth/logout",
    { refresh_token: refreshToken },
    token,
  );
}

export function getMeApi(token: string): Promise<UserProfile> {
  return apiClient.get<UserProfile>("/auth/me", token);
}
