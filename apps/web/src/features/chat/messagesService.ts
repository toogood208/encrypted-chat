/**
 * messagesService — orchestrates the full send and receive flows.
 *
 * Send flow:
 *   1. Fetch recipient's public key from server
 *   2. Import it as a CryptoKey
 *   3. Get our own public key from the auth store (already stored on register)
 *   4. encryptMessage(plaintext, recipientKey, ownKey) → EncryptedPayload
 *   5. POST /messages with the payload
 *
 * Load history flow:
 *   1. GET /conversations/{userId}/messages (paginated)
 *   2. For each message, decryptMessage(payload, privateKey, isSender)
 *   3. Return decrypted messages sorted oldest-first for display
 */

import { getMessagesApi, sendMessageApi } from "../../infrastructure/api/conversations";
import { getUserPublicKeyApi } from "../../infrastructure/api/users";
import { encryptMessage, decryptMessage } from "../../infrastructure/webcrypto/messaging";
import { importPublicKey } from "../../infrastructure/webcrypto/keygen";
import { base64ToBuffer } from "../../infrastructure/webcrypto/encode";
import { tokenStorage } from "../../domain/session/tokens";
import { cryptoSession } from "../../domain/session/cryptoSession";
import { useAuthStore } from "../auth/state/authStore";
import type { MessageResponse } from "../../shared/types/messages";

export interface DecryptedMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  plaintext: string;
  created_at: string;
  isSender: boolean;
}

function getRequiredToken(): string {
  const token = tokenStorage.getAccess();
  if (!token) throw new Error("Not authenticated.");
  return token;
}

function getRequiredPrivateKey(): CryptoKey {
  const key = cryptoSession.getPrivateKey();
  if (!key) throw new Error("Crypto session not ready. Please log in again.");
  return key;
}

/** Load and decrypt a page of message history with a partner. */
export async function loadMessages(
  partnerUserId: string,
  opts: { limit?: number; before?: string } = {},
  signal?: AbortSignal,
): Promise<DecryptedMessage[]> {
  const token = getRequiredToken();
  const privateKey = getRequiredPrivateKey();
  const myUserId = useAuthStore.getState().user?.id;

  const raw = await getMessagesApi(partnerUserId, token, opts, signal);

  // Decrypt each message concurrently
  const decrypted = await Promise.all(
    raw.map(async (msg): Promise<DecryptedMessage> => {
      const isSender = msg.from_user_id === myUserId;
      const plaintext = await decryptMessage(msg.payload, privateKey, isSender);
      return {
        id: msg.id,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        plaintext,
        created_at: msg.created_at,
        isSender,
      };
    }),
  );

  // API returns newest-first — reverse so oldest is at the top for display
  return decrypted.reverse();
}

/** Encrypt and send a message to a partner. Returns the decrypted form for
 *  immediate local display without waiting for a WebSocket echo. */
export async function sendMessage(
  partnerUserId: string,
  plaintext: string,
): Promise<DecryptedMessage> {
  const token = getRequiredToken();
  const myUser = useAuthStore.getState().user;
  if (!myUser) throw new Error("Not authenticated.");

  // Fetch recipient's public key and import it
  const { public_key: recipientKeyB64 } = await getUserPublicKeyApi(partnerUserId, token);
  const recipientPublicKey = await importPublicKey(base64ToBuffer(recipientKeyB64));

  // Import our own public key (stored in the user profile as base64 SPKI)
  const ownPublicKey = await importPublicKey(base64ToBuffer(myUser.public_key));

  // Encrypt
  const payload = await encryptMessage(plaintext, recipientPublicKey, ownPublicKey);

  // Send via REST — WebSocket layer (step 4) will take over for real-time
  const sent: MessageResponse = await sendMessageApi(
    { to: partnerUserId, payload },
    token,
  );

  return {
    id: sent.id,
    from_user_id: sent.from_user_id,
    to_user_id: sent.to_user_id,
    plaintext,
    created_at: sent.created_at,
    isSender: true,
  };
}
