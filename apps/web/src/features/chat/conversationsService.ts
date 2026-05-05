import { getConversationsApi } from "../../infrastructure/api/conversations";
import { tokenStorage } from "../../domain/session/tokens";
import type { ConversationSummary } from "../../shared/types/messages";

export async function getConversations(signal?: AbortSignal): Promise<ConversationSummary[]> {
  const token = tokenStorage.getAccess();
  if (!token) throw new Error("Not authenticated.");
  return getConversationsApi(token, signal);
}
