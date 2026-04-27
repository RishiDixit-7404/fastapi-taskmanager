import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: Boolean(accessToken),
    isAdmin: user?.role === "admin",
    setTokens,
    setUser,
    clearAuth,
  };
}
