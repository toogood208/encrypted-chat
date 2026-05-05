# Web App Architecture

This frontend consumes an external E2EE API and WebSocket service.

## Source layout

- `src/app`: app bootstrap concerns (providers, router, layouts)
- `src/features`: user-facing features grouped by domain
  - `auth`: login, register, session restore
  - `chat`: conversation list, thread view, composer
  - `users`: search and public key lookup
  - `presence`: online or offline indicators
- `src/domain`: use-case logic
  - `crypto`: key generation, wrapping, encrypt and decrypt use-cases
  - `session`: token and crypto session lifecycle
  - `messaging`: send, receive, history workflows
- `src/infrastructure`: integration adapters
  - `api`: REST client and endpoint calls
  - `websocket`: realtime transport and event bus
  - `storage`: IndexedDB and secure persistence adapters
  - `webcrypto`: browser crypto wrappers
- `src/shared`: reusable components, hooks, utilities, and types
- `src/styles`: theming and global style layers

## Architectural rules

- Plaintext and private key handling stays in frontend only.
- Infrastructure code does not contain UI rendering logic.
- Feature state should not persist raw private key material.
- API and WebSocket contracts should be defined once in shared packages.
