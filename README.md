# encrypted-chat

Frontend-only workspace for an end-to-end encrypted messaging client.

## App

- `apps/web`: React + Vite client with Web Crypto integration, consuming the external WhisperBox API.

## Packages

- `packages/contracts`: shared API and websocket contracts
- `packages/validation`: shared request and payload schemas
- `packages/design-system`: shared design tokens and primitives
- `packages/ts-config`: shared TypeScript configurations
- `packages/eslint-config`: shared ESLint configurations

## Quick start

1. Install dependencies:
   - `npm.cmd install`
2. Run development server:
   - `npm.cmd run dev`

## Notes

- The backend is external and consumed via API and WebSocket.
- Local focus is frontend architecture and implementation.
- See docs in `docs/` for implementation and security guidance.
