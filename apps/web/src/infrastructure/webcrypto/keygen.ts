/**
 * Generate a 2048-bit RSA-OAEP key pair.
 * Both keys are extractable so the public key can be exported as SPKI
 * and the private key can be wrapped with AES-KW.
 */
export function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/** Export a public CryptoKey as a raw SPKI ArrayBuffer. */
export function exportPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("spki", publicKey);
}

/** Import an SPKI ArrayBuffer as an RSA-OAEP public key for encryption. */
export function importPublicKey(spki: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
}
