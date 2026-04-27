import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deactivateUser, listUsers, patchUserRole } from "../api/users";
import type { UserRole } from "../types/api";

export function useUsers(role?: UserRole | "all", enabled = true) {
  return useQuery({
    queryKey: ["users", role || "all"],
    queryFn: () => listUsers(role),
    enabled,
  });
}

export function usePatchUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => patchUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
