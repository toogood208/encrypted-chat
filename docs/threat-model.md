# Threat Model

Date: 2026-05-05

## 1) Assets to Protect

- User credentials
- Access and refresh tokens
- Private key material and key-encryption secrets
- Plaintext message content
- Message metadata (conversation graph, timestamps)

## 2) Trust Boundaries

- Browser runtime boundary
- Storage boundary (IndexedDB)
- API boundary (HTTPS)
- WebSocket boundary (WSS)
- Database boundary (ciphertext only)

## 3) Adversaries

- Passive network observer
- Active MITM (without TLS break)
- Credential stuffing attacker
- Token theft attacker
- Malicious or curious backend operator
- XSS attacker in client context

## 4) Primary Threats and Controls

1. Credential theft
- Control: password hashing, rate limiting, breach lockouts, MFA-ready design.

2. Token replay or theft
- Control: short access token TTL, refresh token rotation, revocation checks, device-aware sessions.

3. Server-side plaintext exposure
- Control: encrypt client-side only, no plaintext API fields, no decryption routines on backend.

4. Private key exfiltration
- Control: never transmit private key, store only encrypted bundle, memory-only unlocked key.

5. Message replay attacks
- Control: message idempotency keys, nonce or timestamp replay windows.

6. XSS leading to key theft
- Control: strict CSP, output encoding, dependency auditing, avoid dangerous HTML rendering.

7. Metadata leakage
- Control: minimize logs, avoid sensitive event payloads in telemetry, retention limits.

## 5) Abuse Cases

- User sends malformed WS frame to crash parser.
- Bot floods /users/search.
- User attempts sending messages to self repeatedly for abuse probing.
- Stolen refresh token used after logout.

## 6) Validation Checklist

- DTO validation for every endpoint and WS event.
- WS event schema checks with explicit error responses.
- DB constraints for message ownership and user references.
- Auth checks on every protected route and handler.

## 7) Residual Risks

- Endpoint traffic analysis still leaks communication timing and pairwise metadata.
- Compromised browser context can expose runtime plaintext and unlocked keys.

## 8) Review Cadence

- Update this document on every auth, key, or messaging protocol change.
- Security review gate required before production release.
