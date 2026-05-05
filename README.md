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
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Install

```bash
npm install
```

### Dev server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Type check

```bash
npm run typecheck
```

## Authentication Flow

```
Register:
  generate RSA keypair + PBKDF2 salt (client)
  → wrap private key with password-derived AES-GCM key
  → POST /auth/register (public key + wrapped private key + salt)
  → store tokens in sessionStorage
  → store wrapped key bundle in IndexedDB
  → keep live private key in RAM

Login:
  POST /auth/login → get tokens + wrapped key bundle
  → PBKDF2(password, salt) → AES-GCM decrypt → live private key in RAM
  → store tokens in sessionStorage
  → store wrapped key bundle in IndexedDB
```

## Messaging Flow

```
Send:
  fetch recipient's public key from server
  → generate random AES-GCM key + IV
  → encrypt plaintext with AES key
  → encrypt AES key with recipient's public key (encryptedKey)
  → encrypt AES key with own public key (encryptedKeyForSelf)
  → POST /messages

Receive (WebSocket):
  message.receive frame arrives
  → RSA-OAEP decrypt encryptedKey with own private key → AES key
  → AES-GCM decrypt ciphertext → plaintext
```

## Deployment

Deployed on Vercel. The `vercel.json` at the root handles the monorepo build configuration and SPA routing rewrites.

```bash
vercel --prod
```

## Backend

This frontend consumes the [WhisperBox API](https://whisperbox.koyeb.app/docs) — a separately deployed FastAPI backend.
