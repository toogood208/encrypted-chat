/**
 * Auth service — orchestrates the full register flow:
 *   keygen → wrap → API call → store tokens → persist key bundle → load into session
 *
 * All crypto happens on the client. The server never sees plaintext or the private key.
 */

import { generateKeyPair, exportPublicKey } from "../../infrastructure/webcrypto/keygen";
import { generateSalt, wrapPrivateKey, unwrapPrivateKey } from "../../infrastructure/webcrypto/wrapping";
import { bufferToBase64, base64ToBuffer } from "../../infrastructure/webcrypto/encode";
import { registerApi, loginApi } from "../../infrastructure/api/auth";
import { storeKeyBundle } from "../../infrastructure/storage/keystore";
import { tokenStorage } from "../../domain/session/tokens";
import { cryptoSession } from "../../domain/session/cryptoSession";
import { useAuthStore } from "./state/authStore";

export async function register(
  username: string,
  displayName: string,
  password: string,
): Promise<void> {
  // 1. Generate 2048-bit RSA-OAEP key pair on the client
  const keyPair = await generateKeyPair();

  // 2. Generate 128-bit PBKDF2 salt
  const salt = generateSalt();

  // 3. Export public key as base64 SPKI — this goes to the server
  const publicKeyBuffer = await exportPublicKey(keyPair.publicKey);
  const public_key = bufferToBase64(publicKeyBuffer);

  // 4. Wrap private key with password-derived AES-KW — also goes to server for backup
  const wrappedBuffer = await wrapPrivateKey(keyPair.privateKey, password, salt);
  const wrapped_private_key = bufferToBase64(wrappedBuffer);
  const pbkdf2_salt = bufferToBase64(salt.buffer as ArrayBuffer);

  // 5. Send registration payload to server
  const response = await registerApi({
    username,
    display_name: displayName,
    password,
    public_key,
    wrapped_private_key,
    pbkdf2_salt,
  });

  // 6. Persist access + refresh tokens in sessionStorage (tab-scoped)
  tokenStorage.set(response.access_token, response.refresh_token);

  // 7. Persist the server's canonical key bundle in IndexedDB for login session restore
  await storeKeyBundle(response.user.id, {
    wrapped_private_key: response.user.wrapped_private_key,
    pbkdf2_salt: response.user.pbkdf2_salt,
  });

  // 8. Load private key into memory only — never written to disk in plaintext
  cryptoSession.set(response.user.id, keyPair.privateKey);

  // 9. Update auth store
  useAuthStore.getState().setAuth(response.user);
}

export async function login(username: string, password: string): Promise<void> {
  // 1. Exchange credentials for tokens + key material
  const response = await loginApi({ username, password });

  // 2. Decode the base64 key bundle from the server
  const wrappedBuffer = base64ToBuffer(response.user.wrapped_private_key);
  const saltBuffer = base64ToBuffer(response.user.pbkdf2_salt);

  // 3. Re-derive wrapping key from password and decrypt the private key
  const privateKey = await unwrapPrivateKey(wrappedBuffer, password, new Uint8Array(saltBuffer));

  // 4. Persist tokens (tab-scoped)
  tokenStorage.set(response.access_token, response.refresh_token);

  // 5. Persist key bundle in IndexedDB for future session restore
  await storeKeyBundle(response.user.id, {
    wrapped_private_key: response.user.wrapped_private_key,
    pbkdf2_salt: response.user.pbkdf2_salt,
  });

  // 6. Load private key into memory only — never written to disk in plaintext
  cryptoSession.set(response.user.id, privateKey);

  // 7. Update auth store
  useAuthStore.getState().setAuth(response.user);
}
