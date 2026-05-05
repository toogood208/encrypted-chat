import { apiClient } from "./client";
import type { UserPublicInfo, UserPublicKey } from "../../shared/types/messages";

export function searchUsersApi(
  q: string,
  token: string,
  signal?: AbortSignal,
): Promise<UserPublicInfo[]> {
  return apiClient.get<UserPublicInfo[]>(
    `/users/search?q=${encodeURIComponent(q)}`,
    token,
    signal,
  );
}

export function getUserPublicKeyApi(
  userId: string,
  token: string,
): Promise<UserPublicKey> {
  return apiClient.get<UserPublicKey>(`/users/${userId}/public-key`, token);
}
