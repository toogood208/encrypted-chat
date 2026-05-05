import { apiClient } from "./client";
import type {
  ConversationSummary,
  MessageResponse,
  SendMessageRequest,
} from "../../shared/types/messages";

export function getConversationsApi(
  token: string,
  signal?: AbortSignal,
): Promise<ConversationSummary[]> {
  return apiClient.get<ConversationSummary[]>("/conversations", token, signal);
}

export function getMessagesApi(
  userId: string,
  token: string,
  opts: { limit?: number; before?: string } = {},
  signal?: AbortSignal,
): Promise<MessageResponse[]> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.before) params.set("before", opts.before);
  const qs = params.size > 0 ? `?${params.toString()}` : "";
  return apiClient.get<MessageResponse[]>(
    `/conversations/${userId}/messages${qs}`,
    token,
    signal,
  );
}

export function sendMessageApi(
  body: SendMessageRequest,
  token: string,
): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>("/messages", body, token);
}
