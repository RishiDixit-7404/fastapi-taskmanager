import { apiClient } from "./client";
import type { TaskCreate, TaskPatch, TaskPriority, TaskResponse, TaskStatus, TaskUpdate } from "../types/api";

export interface TaskFilters {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assignee_id?: number;
}

export async function listTasks(projectId: number, filters: TaskFilters = {}) {
  const response = await apiClient.get<TaskResponse[]>(`/projects/${projectId}/tasks`, {
    params: {
      status: filters.status && filters.status !== "all" ? filters.status : undefined,
      priority: filters.priority && filters.priority !== "all" ? filters.priority : undefined,
      assignee_id: filters.assignee_id,
    },
  });
  return response.data;
}

export async function createTask(projectId: number, payload: TaskCreate) {
  const response = await apiClient.post<TaskResponse>(`/projects/${projectId}/tasks`, payload);
  return response.data;
}

export async function getTask(id: number) {
  const response = await apiClient.get<TaskResponse>(`/tasks/${id}`);
  return response.data;
}

export async function updateTask(id: number, payload: TaskUpdate) {
  const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, payload);
  return response.data;
}

export async function patchTask(id: number, payload: TaskPatch) {
  const response = await apiClient.patch<TaskResponse>(`/tasks/${id}`, payload);
  return response.data;
}

export async function patchTaskStatus(id: number, status: TaskStatus) {
  const response = await apiClient.patch<TaskResponse>(`/tasks/${id}/status`, { status });
  return response.data;
}

export async function deleteTask(id: number) {
  await apiClient.delete(`/tasks/${id}`);
}

export async function attachTag(taskId: number, tagId: number) {
  const response = await apiClient.post<TaskResponse>(`/tasks/${taskId}/tags/${tagId}`);
  return response.data;
}

export async function detachTag(taskId: number, tagId: number) {
  await apiClient.delete(`/tasks/${taskId}/tags/${tagId}`);
}
