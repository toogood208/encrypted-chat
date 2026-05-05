# Crypto Decisions Record

Date: 2026-05-05

## 1) Algorithms

- Symmetric message encryption: AES-GCM (256-bit key, 96-bit IV)
- Key encapsulation for recipients: RSA-OAEP (SHA-256)
- Randomness: Web Crypto secure random source

## 2) Message Envelope

Payload fields:
- ciphertext: base64 AES-GCM encrypted bytes
- iv: base64 96-bit IV
- encryptedKey: base64 RSA-OAEP encrypted AES key for recipient
- encryptedKeyForSelf: base64 RSA-OAEP encrypted AES key for sender history decryption

Additional envelope metadata (transport level):
- id
- from_user_id
- to_user_id
- created_at

## 3) Key Lifecycle

- Generate key pair client-side during registration.
- Send only public key to backend.
- Persist private key only as encrypted bundle in IndexedDB.
- Import and unwrap private key into runtime memory after login.
- Clear unlocked key material on logout and session invalidation.

## 4) Rotation Strategy (Planned)

- Support key version tagging on user profile.
- New outbound messages use latest public key version.
- Keep previous private keys available for decrypting historical messages.

## 5) Failure Handling

- On decrypt failure, show non-blocking per-message error state.
- Do not crash conversation render if one message fails decryption.
- Allow retry decrypt action if key state changes.

## 6) Non-Goals for V1

- No group messaging key distribution in V1.
- No multi-device cross-signing protocol in V1.
- No deniability protocol beyond transport and encryption primitives.

## 7) Must Not Do

- Do not store raw private keys unencrypted.
- Do not hardcode keys or salts.
- Do not perform plaintext logging of message content.
- Do not add server-side decrypt helpers.
