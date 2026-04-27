import { apiClient } from "./client";
import type { CommentResponse } from "../types/api";

export async function listComments(taskId: number) {
  const response = await apiClient.get<CommentResponse[]>(`/tasks/${taskId}/comments`);
  return response.data;
}

export async function createComment(taskId: number, body: string) {
  const response = await apiClient.post<CommentResponse>(`/tasks/${taskId}/comments`, { body });
  return response.data;
}

export async function updateComment(id: number, body: string) {
  const response = await apiClient.put<CommentResponse>(`/comments/${id}`, { body });
  return response.data;
}

export async function deleteComment(id: number) {
  await apiClient.delete(`/comments/${id}`);
}
