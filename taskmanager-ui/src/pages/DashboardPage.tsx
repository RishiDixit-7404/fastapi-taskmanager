import { Activity, FolderKanban, Shield, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { LoadingBlock } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { useHealth } from "../hooks/useHealth";
import { useProjects } from "../hooks/useProjects";
import { formatDate } from "../utils/formatDate";

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const health = useHealth();
  const projects = useProjects();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Projects" value={projects.data?.length ?? 0} icon={FolderKanban} />
        <MetricCard label="API health" value={health.data?.status || "-"} icon={Activity} />
        <MetricCard label="Admin" value={isAdmin ? "enabled" : "standard"} icon={Shield} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <p className="text-sm text-muted-foreground">Your active workspace inventory</p>
          </CardHeader>
          <CardContent>
            {projects.isLoading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-3">
                {(projects.data || []).slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted/60"
                  >
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground">{project.status}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDate(project.updated_at)}</div>
                  </Link>
                ))}
                {!projects.data?.length ? <p className="text-sm text-muted-foreground">No projects yet.</p> : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">System health</h2>
            <p className="text-sm text-muted-foreground">Backend connectivity check</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.isLoading ? (
              <LoadingBlock />
            ) : (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-2xl font-semibold">{health.data?.status || "unavailable"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Version</div>
                  <div className="font-medium">{health.data?.version || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Timestamp</div>
                  <div className="font-medium">{formatDate(health.data?.timestamp)}</div>
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Link className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" to="/projects">
                Open projects
              </Link>
              <Link className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" to="/api-keys">
                Manage API keys
              </Link>
              {isAdmin ? (
                <Link className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" to="/admin">
                  Open admin panel
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-md bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
