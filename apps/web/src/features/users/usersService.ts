import { searchUsersApi } from "../../infrastructure/api/users";
import { tokenStorage } from "../../domain/session/tokens";
import type { UserPublicInfo } from "../../shared/types/messages";

export async function searchUsers(
  q: string,
  signal?: AbortSignal,
): Promise<UserPublicInfo[]> {
  const token = tokenStorage.getAccess();
  if (!token) throw new Error("Not authenticated.");
  return searchUsersApi(q, token, signal);
}
