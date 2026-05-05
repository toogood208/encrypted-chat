import { create } from "zustand";
import type { UserProfile } from "../../../shared/types/auth";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setAuth(user) {
    set({ user, isAuthenticated: true });
  },
  clearAuth() {
    set({ user: null, isAuthenticated: false });
  },
}));
