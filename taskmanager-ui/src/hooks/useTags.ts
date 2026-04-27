import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTag, deleteTag, listTags } from "../api/tags";
import type { TagCreate } from "../types/api";

export function useTags(name?: string) {
  return useQuery({
    queryKey: ["tags", name || ""],
    queryFn: () => listTags(name),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TagCreate) => createTag(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}
