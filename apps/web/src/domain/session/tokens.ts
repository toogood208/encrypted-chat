/**
 * Session-scoped token storage.
 *
 * Uses sessionStorage (tab-scoped) intentionally — tokens are cleared
 * when the tab closes. Never use localStorage for auth tokens.
 */

const ACCESS_KEY = "wb:at";
const REFRESH_KEY = "wb:rt";

export const tokenStorage = {
  set(access: string, refresh: string): void {
    sessionStorage.setItem(ACCESS_KEY, access);
    sessionStorage.setItem(REFRESH_KEY, refresh);
  },

  updateAccess(access: string): void {
    sessionStorage.setItem(ACCESS_KEY, access);
  },

  getAccess(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  },

  getRefresh(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  },

  clear(): void {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};
