import { bufferToBase64, base64ToBuffer } from "./encode";
import type { EncryptedPayload } from "../../shared/types/messages";

/**
 * Encrypt a plaintext message for a recipient.
 *
 * Steps:
 *   1. Generate a fresh random AES-GCM 256-bit key (used for this message only)
 *   2. Generate a fresh random 96-bit IV
 *   3. Encrypt the plaintext with that AES key + IV → ciphertext
 *   4. Encrypt the AES key with the recipient's RSA public key → encryptedKey
 *   5. Encrypt the AES key with our own RSA public key → encryptedKeyForSelf
 *      (so we can decrypt our own sent messages later)
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  ownPublicKey: CryptoKey,
): Promise<EncryptedPayload> {
  // 1 & 2 — fresh AES-GCM key and IV, never reused
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // must be extractable so we can wrap it with RSA
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3 — encrypt the message text
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(plaintext),
  );

  // 4 & 5 — export the raw AES key bytes, then RSA-encrypt them for each party
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  const [encryptedKeyBuffer, encryptedKeyForSelfBuffer] = await Promise.all([
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientPublicKey, rawAesKey),
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, ownPublicKey, rawAesKey),
  ]);

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    encryptedKey: bufferToBase64(encryptedKeyBuffer),
    encryptedKeyForSelf: bufferToBase64(encryptedKeyForSelfBuffer),
  };
}

/**
 * Decrypt a message payload using our RSA private key.
 *
 * Pass isSender=true when the message was sent by us — it reads
 * encryptedKeyForSelf instead of encryptedKey.
 *
 * Steps:
 *   1. RSA-decrypt the correct key field → raw AES key bytes
 *   2. Import those bytes back as a CryptoKey
 *   3. AES-GCM decrypt the ciphertext → plaintext bytes
 *   4. Decode to string
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  isSender: boolean = false,
): Promise<string> {
  const encryptedAesKey = isSender
    ? base64ToBuffer(payload.encryptedKeyForSelf)
    : base64ToBuffer(payload.encryptedKey);

  // 1 — recover the AES key using our private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKey,
  );

  // 2 — import it as a usable CryptoKey
  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // 3 — decrypt the message body
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(payload.iv) },
    aesKey,
    base64ToBuffer(payload.ciphertext),
  );

  // 4 — bytes → string
  return new TextDecoder().decode(plaintextBuffer);
}
