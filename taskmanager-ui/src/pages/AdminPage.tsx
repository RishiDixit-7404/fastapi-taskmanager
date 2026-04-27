import { Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";
import { useStats } from "../hooks/useHealth";
import { useDeactivateUser, usePatchUserRole, useUsers } from "../hooks/useUsers";
import type { UserRole } from "../types/api";

export function AdminPage() {
  const stats = useStats();
  const users = useUsers();
  const patchRole = usePatchUserRole();
  const deactivate = useDeactivateUser();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Users" value={stats.data?.total_users ?? "-"} />
        <StatCard label="Projects" value={stats.data?.total_projects ?? "-"} />
        <StatCard label="Tasks" value={stats.data?.total_tasks ?? "-"} />
        <StatCard label="Statuses" value={Object.keys(stats.data?.tasks_by_status || {}).length || "-"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-sm text-muted-foreground">Change roles and deactivate accounts.</p>
          </CardHeader>
          <CardContent>
            {users.isLoading ? <LoadingBlock /> : null}
            {!users.isLoading && !users.data?.length ? <EmptyState message="No users found." /> : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{user.full_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Select
                          value={user.role}
                          onChange={async (event) => {
                            try {
                              await patchRole.mutateAsync({ id: user.id, role: event.target.value as UserRole });
                              toast.success("User role updated");
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
                        <Badge tone={user.is_active ? "green" : "slate"}>{user.is_active ? "active" : "inactive"}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="danger"
                          disabled={!user.is_active}
                          onClick={async () => {
                            if (!window.confirm(`Deactivate ${user.full_name}?`)) return;
                            try {
                              await deactivate.mutateAsync(user.id);
                              toast.success("User deactivated");
                            } catch (error) {
                              toast.error(getApiErrorMessage(error, "Could not deactivate user"));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Task status</h2>
            <p className="text-sm text-muted-foreground">Global distribution from `/stats`.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.isLoading ? <LoadingBlock /> : null}
            {Object.entries(stats.data?.tasks_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{status}</span>
                <Badge tone="blue">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className="rounded-md bg-primary/10 p-3 text-primary">
          <Shield className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
