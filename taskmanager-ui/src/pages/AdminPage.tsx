import { CheckSquare, FolderKanban, LayoutList, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";
import { useStats } from "../hooks/useHealth";
import { useDeactivateUser, usePatchUserRole, useUsers } from "../hooks/useUsers";
import type { UserResponse, UserRole } from "../types/api";

const statusColors: Record<string, "slate" | "amber" | "green" | "red"> = {
  todo: "slate",
  in_progress: "amber",
  done: "green",
  blocked: "red",
};

export function AdminPage() {
  const stats = useStats();
  const users = useUsers();
  const patchRole = usePatchUserRole();
  const deactivate = useDeactivateUser();
  const [toDeactivate, setToDeactivate] = useState<UserResponse | null>(null);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.data?.total_users ?? "-"}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Projects"
          value={stats.data?.total_projects ?? "-"}
          icon={FolderKanban}
          tone="purple"
        />
        <StatCard
          label="Tasks"
          value={stats.data?.total_tasks ?? "-"}
          icon={CheckSquare}
          tone="green"
        />
        <StatCard
          label="Completed"
          value={stats.data?.tasks_by_status?.done ?? "-"}
          icon={LayoutList}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Users table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-sm text-muted-foreground">Change roles and deactivate accounts.</p>
          </CardHeader>
          <CardContent>
            {users.isError ? <Alert>{getApiErrorMessage(users.error, "Could not load users")}</Alert> : null}
            {users.isLoading ? <LoadingBlock /> : null}
            {!users.isLoading && !users.isError && !users.data?.length ? (
              <EmptyState message="No users found." />
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(users.data || []).map((user) => (
                    <tr key={user.id} className="border-b transition last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">{user.full_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Select
                          className="w-28"
                          value={user.role}
                          onChange={async (e) => {
                            try {
                              await patchRole.mutateAsync({ id: user.id, role: e.target.value as UserRole });
                              toast.success("Role updated");
                            } catch (error) {
                              toast.error(getApiErrorMessage(error, "Could not update role"));
                            }
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </Select>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={user.is_active ? "green" : "slate"}>
                          {user.is_active ? "active" : "inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="danger"
                          className="h-8 px-3 text-xs"
                          disabled={!user.is_active}
                          onClick={() => setToDeactivate(user)}
                        >
                          Deactivate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Task status breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Task breakdown</h2>
            <p className="text-sm text-muted-foreground">Global distribution from <code className="rounded bg-muted px-1">/stats</code>.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.isError ? <Alert>{getApiErrorMessage(stats.error, "Could not load stats")}</Alert> : null}
            {stats.isLoading ? <LoadingBlock /> : null}
            {!stats.isLoading && !stats.isError && !Object.keys(stats.data?.tasks_by_status || {}).length ? (
              <EmptyState message="No task data yet." />
            ) : null}
            {Object.entries(stats.data?.tasks_by_status || {}).map(([status, count]) => {
              const total = stats.data?.total_tasks || 1;
              const pct = Math.round(((count as number) / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone={statusColors[status] ?? "slate"}>{status}</Badge>
                    </div>
                    <span className="font-medium">{count as number}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title={`Deactivate ${toDeactivate?.full_name}?`}
        description="This user will lose access to the platform. Their data is preserved and the action can be reversed by re-activating via the API."
        confirmLabel="Deactivate"
        onCancel={() => setToDeactivate(null)}
        onConfirm={async () => {
          if (!toDeactivate) return;
          try {
            await deactivate.mutateAsync(toDeactivate.id);
            toast.success("User deactivated");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not deactivate user"));
          } finally {
            setToDeactivate(null);
          }
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "blue" | "purple" | "green" | "amber";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    purple: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
