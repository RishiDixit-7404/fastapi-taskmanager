import { apiClient } from "./client";
import type { ProjectCreate, ProjectPatch, ProjectResponse, ProjectStatus, ProjectUpdate } from "../types/api";

export async function listProjects(status?: ProjectStatus | "all") {
  const response = await apiClient.get<ProjectResponse[]>("/projects", {
    params: status && status !== "all" ? { status } : undefined,
  });
  return response.data;
}

export async function createProject(payload: ProjectCreate) {
  const response = await apiClient.post<ProjectResponse>("/projects", payload);
  return response.data;
}

export async function getProject(id: number) {
  const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
  return response.data;
}

export async function updateProject(id: number, payload: ProjectUpdate) {
  const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, payload);
  return response.data;
}

export async function patchProject(id: number, payload: ProjectPatch) {
  const response = await apiClient.patch<ProjectResponse>(`/projects/${id}`, payload);
  return response.data;
}

export async function deleteProject(id: number) {
  await apiClient.delete(`/projects/${id}`);
}
