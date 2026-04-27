import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestHeaders,
} from "axios";

import { useAuthStore } from "../store/authStore";
import type { ApiErrorBody, TokenResponse } from "../types/api";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryConfig | undefined;
    const isRefreshCall = original?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && original && !original._retry && !isRefreshCall) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      try {
        original._retry = true;
        const response = await axios.post<TokenResponse>(
          `${baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { Accept: "application/json", "Content-Type": "application/json" } },
        );
        useAuthStore.getState().setTokens(response.data);
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${response.data.access_token}`,
        } as AxiosRequestHeaders;
        return apiClient(original);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

function forceLogout() {
  useAuthStore.getState().clearAuth();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (detail) {
      return JSON.stringify(detail);
    }
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
