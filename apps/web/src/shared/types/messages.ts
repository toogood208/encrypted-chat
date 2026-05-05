export interface ConversationSummary {
  user_id: string;
  display_name: string;
  username: string;
  last_message_at: string | null;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

export interface MessageResponse {
  id: string;
  from_user_id: string;
  to_user_id: string;
  payload: EncryptedPayload;
  delivered: boolean;
  created_at: string;
}

export interface SendMessageRequest {
  to: string;
  payload: EncryptedPayload;
}

export interface UserPublicInfo {
  id: string;
  username: string;
  display_name: string;
}

export interface UserPublicKey {
  public_key: string;
}
