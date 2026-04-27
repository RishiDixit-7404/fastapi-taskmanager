import { apiClient } from "./client";
import type { UserResponse, UserRole } from "../types/api";

export async function listUsers(role?: UserRole | "all") {
  const response = await apiClient.get<UserResponse[]>("/users", {
    params: role && role !== "all" ? { role } : undefined,
  });
  return response.data;
}

export async function patchUserRole(id: number, role: UserRole) {
  const response = await apiClient.patch<UserResponse>(`/users/${id}/role`, { role });
  return response.data;
}

export async function deactivateUser(id: number) {
  await apiClient.delete(`/users/${id}`);
}
