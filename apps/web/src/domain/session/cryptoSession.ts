/**
 * In-memory crypto session.
 *
 * Holds the unlocked RSA private CryptoKey for the duration of the session.
 * This object is NEVER serialized or persisted — it lives only in JS memory.
 * Cleared on logout, session expiry, or tab close.
 */

interface Session {
  userId: string | null;
  privateKey: CryptoKey | null;
}

const _session: Session = {
  userId: null,
  privateKey: null,
};

export const cryptoSession = {
  set(userId: string, privateKey: CryptoKey): void {
    _session.userId = userId;
    _session.privateKey = privateKey;
  },

  getPrivateKey(): CryptoKey | null {
    return _session.privateKey;
  },

  getUserId(): string | null {
    return _session.userId;
  },

  isReady(): boolean {
    return _session.privateKey !== null;
  },

  clear(): void {
    _session.userId = null;
    _session.privateKey = null;
  },
};
