import { create } from "zustand";

import type { TokenResponse, UserResponse } from "../types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  setTokens: (tokens: TokenResponse) => void;
  setUser: (user: UserResponse | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setTokens: (tokens) =>
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    }),
  setUser: (user) => set({ user }),
  clearAuth: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    }),
}));

export function getIsAdmin() {
  return useAuthStore.getState().user?.role === "admin";
}
