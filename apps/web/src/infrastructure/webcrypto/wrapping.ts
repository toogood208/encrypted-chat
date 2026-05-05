/**
 * PBKDF2 + AES-GCM private key wrapping.
 *
 * The private key is never stored in plaintext.
 * It is exported as PKCS8, then encrypted with AES-GCM using a key
 * derived from the user's password via PBKDF2 (300 000 iterations, SHA-256).
 * A random 12-byte IV is prepended to the ciphertext so it can be recovered on unwrap.
 */

/** Generate a cryptographically random 128-bit PBKDF2 salt. */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

async function deriveWrappingKey(
  password: string,
  salt: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  // Copy into a guaranteed plain ArrayBuffer to satisfy Web Crypto's BufferSource type
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const safeSalt = new Uint8Array(saltBuffer);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: safeSalt, iterations: 300_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

/** Wrap (encrypt) a private CryptoKey using a password-derived AES-GCM key. */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const wrappingKey = await deriveWrappingKey(password, salt, ["encrypt"]);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    pkcs8,
  );

  // Prepend IV so it's available for decryption — IV is not secret
  const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.byteLength);
  return result.buffer as ArrayBuffer;
}

/** Unwrap (decrypt) a wrapped private key using the user's password. */
export async function unwrapPrivateKey(
  wrappedKey: ArrayBuffer,
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(password, salt, ["decrypt"]);
  const data = new Uint8Array(wrappedKey);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    ciphertext,
  );

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
}

