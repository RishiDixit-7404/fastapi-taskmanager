import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createComment, deleteComment, listComments, updateComment } from "../api/comments";

export function useComments(taskId: number) {
  return useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: () => listComments(taskId),
    enabled: Number.isFinite(taskId),
  });
}

export function useCreateComment(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}

export function useUpdateComment(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) => updateComment(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}

export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] }),
  });
}
