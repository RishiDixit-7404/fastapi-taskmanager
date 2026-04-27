import { apiClient } from "./client";
import type { HealthResponse, StatsResponse } from "../types/api";

export async function getHealth() {
  const response = await apiClient.get<HealthResponse>("/health");
  return response.data;
}

export async function getStats() {
  const response = await apiClient.get<StatsResponse>("/stats");
  return response.data;
}
