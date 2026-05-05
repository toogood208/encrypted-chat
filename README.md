# WhisperBox

A browser-based end-to-end encrypted messaging app. The server stores only ciphertext — plaintext never leaves your device.

## Tech Stack

- **React 18** + **TypeScript** + **Vite** — frontend framework
- **Web Crypto API** — all cryptography runs in the browser, no third-party crypto libraries
- **Zustand** — auth state management
- **React Router v6** — client-side routing
- **CSS Modules** + design tokens — scoped, themeable styles
- **WebSocket** — real-time message delivery

## How Encryption Works

WhisperBox uses a **hybrid encryption** scheme:

1. Each message is encrypted with a random **AES-GCM 256-bit key** (fast symmetric encryption)
2. That AES key is encrypted with the **recipient's RSA-OAEP 2048-bit public key** — only they can decrypt it
3. A second copy of the AES key is encrypted with the **sender's own public key** — so they can read their own sent messages
4. The server stores and forwards the encrypted blobs without ever seeing plaintext

### Key Management

| Material | Where it lives |
|---|---|
| Public key | Server (shared openly) |
| Wrapped private key | Server + IndexedDB (AES-GCM encrypted with your password) |
| Live private key | RAM only — never persisted |
| Access / refresh tokens | `sessionStorage` — cleared on tab close |

Private keys are protected with **PBKDF2** (300,000 iterations, SHA-256) before leaving the device — making brute-force attacks computationally expensive.

## Project Structure

```
encrypted-chat/
├── apps/
│   └── web/                        # React frontend
│       └── src/
│           ├── app/router/         # Route guards
│           ├── domain/session/     # Token storage, crypto session (in-memory key)
│           ├── features/
│           │   ├── auth/           # Register, login, auth service, Zustand store
│           │   └── chat/           # Inbox, chat page, messages service, WebSocket hook
│           ├── infrastructure/
│           │   ├── api/            # Typed fetch client, all API endpoints
│           │   ├── storage/        # IndexedDB keystore
│           │   └── webcrypto/      # Keygen, wrapping, messaging crypto
│           └── shared/
│               ├── components/ui/  # Reusable Input, Button components
│               ├── styles/         # Design tokens (CSS variables)
│               └── types/          # Shared TypeScript interfaces
└── packages/
    └── ts-config/                  # Shared TypeScript config
