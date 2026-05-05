# Encrypted Chat Implementation Guide

Date: 2026-05-05

This guide turns the approved API contract into an implementation plan for a secure E2EE messaging application.

Repository mode for this workspace:
- Frontend-only implementation.
- Backend is external and consumed via REST and WebSocket APIs.

## 1) Scope and Security Boundary

Core rule:
- Client handles plaintext and private keys.
- Server handles identity, authentication, routing, delivery, and ciphertext persistence.

Non-negotiables:
- Private keys never leave client devices.
- Backend stores only encrypted message payloads and public keys.
- All transport over HTTPS/WSS.
- Access tokens short-lived, refresh tokens revocable.

## 2) Monorepo Layout

Use this structure before writing feature code:

```
encrypted-chat/
  apps/
    web/
      src/
        app/
          providers/
          router/
          layouts/
        features/
          auth/
          users/
          conversations/
          messages/
          presence/
          settings/
        domain/
          crypto/
          session/
          messaging/
        infrastructure/
          api/
          websocket/
          storage/
          webcrypto/
        shared/
          ui/
          hooks/
          utils/
          types/
        styles/
          tokens/
          themes/
    api/
      src/
        bootstrap/
        config/
        modules/
          auth/
            controller/
            service/
            repository/
            dto/
            validators/
          users/
            controller/
            service/
            repository/
            dto/
            validators/
          conversations/
            controller/
            service/
            repository/
            dto/
            validators/
          messages/
            controller/
            service/
            repository/
            dto/
            validators/
          websocket/
            gateway/
            handlers/
            service/
        middleware/
          auth/
          rate-limit/
          validation/
        infrastructure/
          db/
          cache/
          queue/
        shared/
          errors/
          logger/
  packages/
    contracts/
      api/
      websocket/
      envelope/
    validation/
    design-system/
  docs/
    implementation-guide.md
    threat-model.md
    crypto-decisions.md
```

## 3) Architecture Model

### Backend model (MVC-like)

Per module:
- Controller: request and response mapping only.
- Service: business rules, authz checks, workflow logic.
- Repository: database operations only.
- DTO and validators: strict request and response validation.

Keep crypto concerns out of backend business logic except format validation.

### Frontend model

Use feature-driven slices with clear layers:
- UI components: rendering and interaction only.
- Feature state: request state and optimistic updates.
- Domain services: use-case functions like sendEncryptedMessage.
- Infrastructure adapters: HTTP client, WebSocket client, IndexedDB, Web Crypto wrappers.

## 4) API-to-Module Mapping

### Auth

Endpoints:
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /auth/refresh
- POST /auth/logout

Backend ownership:
- apps/api/src/modules/auth

Frontend ownership:
- apps/web/src/features/auth
- apps/web/src/domain/session
- apps/web/src/infrastructure/storage

Implementation notes:
- Register flow expects client-generated key pair material.
- Login response should include encrypted private key bundle metadata required for client restore.
- /auth/me restores user profile and key metadata after reload.
- Refresh rotates access token without user credentials.
- Logout revokes refresh token only; access token naturally expires.

### Users

Endpoints:
- GET /users/search
- GET /users/{userId}/public-key

Backend ownership:
- apps/api/src/modules/users

Frontend ownership:
- apps/web/src/features/users
- apps/web/src/domain/crypto

Implementation notes:
- Search excludes current user and caps at 20.
- Public key lookup is required before first outbound message to a recipient.
- Add cache TTL for fetched public keys on client side.

### Conversations and Messages

Endpoints:
- GET /conversations
- GET /conversations/{userId}/messages
- POST /messages

Backend ownership:
- apps/api/src/modules/conversations
- apps/api/src/modules/messages

Frontend ownership:
- apps/web/src/features/conversations
- apps/web/src/features/messages
- apps/web/src/domain/messaging

Implementation notes:
- History is newest first and cursor-based by before timestamp.
- POST /messages is fallback when WebSocket is not connected.
- Validate payload fields and base64 shape, but never decrypt server-side.

### WebSocket

Endpoint:
- WS /ws?token=<access_token>

Events client to server:
- message.send

Events server to client:
- message.receive
- user.online
- user.offline
- error

Backend ownership:
- apps/api/src/modules/websocket

Frontend ownership:
- apps/web/src/infrastructure/websocket
- apps/web/src/features/presence
- apps/web/src/features/messages

Implementation notes:
- On connect, flush undelivered messages before normal live stream.
- Keep message event idempotency key to reduce duplicate inserts on reconnect races.

## 5) Theming Plan

Theme structure:
- packages/design-system/tokens: primitive tokens (color, spacing, typography, radius, shadow, motion).
- apps/web/src/styles/themes: semantic themes (light, dark, high-contrast).

Rules:
- Never hardcode brand colors in components.
- Use semantic names like surface-primary, text-muted, state-success.
- Reserve dedicated secure states for encryption indicators:
  - secure
  - decrypting
  - decryption-failed

## 6) State Management Plan

Use three state categories:
- Server state: queries and cache for users, conversations, history, profile.
- UI state: drawers, modals, selected conversation, compose input.
- Sensitive runtime state: unlocked private CryptoKey references and ephemeral session keys.

Key handling:
- Store encrypted private key bundle in IndexedDB.
- Keep unlocked CryptoKey only in memory.
- Clear memory copies on logout, tab close, lock action, and auth failure.

Recommended slices:
- authState
- sessionState
- usersState
- conversationsState
- messagesState
- presenceState
- connectionState

## 7) Routing Plan

Route groups:
- Public:
  - /login
  - /register
- Protected:
  - /app/inbox
  - /app/chat/:userId
  - /app/settings/security

Route guards:
- Require valid access token.
- Require key material restore success before entering chat routes.
- If key restore fails, route to secure recovery screen.

Error boundaries:
- Conversation route boundary handles decryption failures gracefully.
- Global boundary handles network and token expiry recovery.

## 8) Database and Data Model (Backend)

Minimum tables:
- users
  - id, username, display_name, password_hash, public_key, created_at
- refresh_tokens
  - id, user_id, token_hash, expires_at, revoked_at, created_at
- messages
  - id, from_user_id, to_user_id, ciphertext, iv, encrypted_key, encrypted_key_for_self, delivered, created_at
- presence (optional in-memory/redis)
  - user_id, last_seen, is_online

Indexes:
- messages: (from_user_id, to_user_id, created_at desc), (to_user_id, delivered, created_at)
- users: username unique, lower(username) index for search

## 9) Security Checklist

Transport and auth:
- Enforce HTTPS and WSS only.
- JWT access token expiry 15m.
- Refresh token rotation and revocation list.

Input and abuse controls:
- Validate all DTOs.
- Rate-limit auth, search, and messaging endpoints.
- Add request size limits for payload fields.

Crypto and storage:
- AES-GCM for message encryption.
- RSA-OAEP for encrypting per-message symmetric key.
- Never log payload ciphertext fields at info level.
- Never store raw private key in plain text.

Resilience:
- Handle decryption failures without crashing timeline rendering.
- Protect against replay with message id or nonce tracking window.

## 10) Delivery Plan by Milestone

Milestone 0: Foundation
- Scaffold monorepo folders.
- Define shared contracts and validation schemas.
- Write threat model and crypto decisions doc.

Milestone 1: Auth and identity
- Register, login, me, refresh, logout.
- JWT and refresh token persistence.
- User search and public key endpoint.

Milestone 2: Crypto session on client
- Client key generation and import/export wrappers.
- IndexedDB encrypted key bundle storage.
- Restore key session after login and on reload.

Milestone 3: Offline messaging path
- POST /messages and history endpoints.
- Conversation list endpoint.
- Client encrypt-send and fetch-decrypt loops.

Milestone 4: Realtime and presence
- WS token auth and reconnect strategy.
- message.send and message.receive flow.
- undelivered message flush on connect.
- online and offline presence events.

Milestone 5: Hardening and UX
- Replay defense, idempotency, retry policy.
- Security-focused error UX and indicators.
- Audit logging and metrics.

## 11) Definition of Done

Feature complete only when all pass:
- Server cannot decrypt any message payload.
- Private key never leaves client.
- All listed endpoints and WS events implemented and validated.
- Refresh and logout semantics match contract.
- Message history pagination works exactly as specified.
- Decryption failure path is user-friendly and non-fatal.
- Documentation updated for architecture, threat model, and operations.
