import { apiClient } from "./client";
import type {
  ApiKeyCreateRequest,
  ApiKeyListResponse,
  ApiKeyResponse,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from "../types/api";

export async function registerUser(payload: RegisterRequest) {
  const response = await apiClient.post<UserResponse>("/auth/register", payload);
  return response.data;
}

export async function loginUser(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const response = await apiClient.post<TokenResponse>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<UserResponse>("/auth/me");
  return response.data;
}

export async function logoutUser(refreshToken: string) {
  const response = await apiClient.post<{ message: string }>("/auth/logout", {
    refresh_token: refreshToken,
  });
  return response.data;
}

export async function listApiKeys() {
  const response = await apiClient.get<ApiKeyListResponse[]>("/auth/api-keys");
  return response.data;
}

export async function createApiKey(payload: ApiKeyCreateRequest) {
  const response = await apiClient.post<ApiKeyResponse>("/auth/api-keys", payload);
  return response.data;
}

export async function revokeApiKey(id: number) {
  await apiClient.delete(`/auth/api-keys/${id}`);
}
