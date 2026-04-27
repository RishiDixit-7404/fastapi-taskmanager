import { apiClient } from "./client";
import type { TagCreate, TagResponse } from "../types/api";

export async function listTags(name?: string) {
  const response = await apiClient.get<TagResponse[]>("/tags", {
    params: name ? { name } : undefined,
  });
  return response.data;
}

export async function createTag(payload: TagCreate) {
  const response = await apiClient.post<TagResponse>("/tags", payload);
  return response.data;
}

export async function deleteTag(id: number) {
  await apiClient.delete(`/tags/${id}`);
}
