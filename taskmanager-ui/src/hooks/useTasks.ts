import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attachTag,
  createTask,
  deleteTask,
  detachTag,
  getTask,
  listTasks,
  patchTask,
  patchTaskStatus,
  type TaskFilters,
  updateTask,
} from "../api/tasks";
import type { TaskCreate, TaskPatch, TaskStatus, TaskUpdate } from "../types/api";

export function useProjectTasks(projectId: number, filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["projects", projectId, "tasks", filters],
    queryFn: () => listTasks(projectId, filters),
    enabled: Number.isFinite(projectId),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => getTask(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateTask(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreate) => createTask(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask(taskId: number, projectId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskUpdate) => updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      }
    },
  });
}

export function usePatchTask(taskId: number, projectId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskPatch) => patchTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      }
    },
  });
}

export function usePatchTaskStatus(taskId: number, projectId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TaskStatus) => patchTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      }
    },
  });
}

export function useDeleteTask(projectId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      }
    },
  });
}

export function useAttachTag(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => attachTag(taskId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId] }),
  });
}

export function useDetachTag(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => detachTag(taskId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId] }),
  });
}
