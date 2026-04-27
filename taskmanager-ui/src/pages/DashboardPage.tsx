import { Activity, ArrowRight, FolderKanban, Shield, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { getApiErrorMessage } from "../api/client";
import { ProjectStatusBadge } from "../components/projects/ProjectStatusBadge";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { LoadingBlock } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { useHealth } from "../hooks/useHealth";
import { useProjects } from "../hooks/useProjects";
import { formatDate } from "../utils/formatDate";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const health = useHealth();
  const projects = useProjects();

  const healthStatus = health.data?.status;
  const healthTone = healthStatus === "ok" ? "green" : healthStatus ? "amber" : "slate";

  return (
    <div className="space-y-6">
      {/* Welcome bar */}
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in your workspace.</p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {projects.isLoading ? (
          <>
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </>
        ) : (
          <>
            <MetricCard label="Your projects" value={projects.data?.length ?? 0} icon={FolderKanban} />
            <MetricCard
              label="API health"
              value={health.data?.status || (health.isLoading ? "…" : "unavailable")}
              icon={Activity}
            />
            <MetricCard label="Access level" value={isAdmin ? "Admin" : "Standard"} icon={Shield} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Recent projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent projects</h2>
                <p className="text-sm text-muted-foreground">Your 5 most recently updated projects</p>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projects.isError ? (
              <Alert>{getApiErrorMessage(projects.error, "Could not load projects")}</Alert>
            ) : null}
            {projects.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(projects.data || []).slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted/60"
                  >
                    <div className="flex items-center gap-3">
                      <ProjectStatusBadge status={project.status} />
                      <span className="font-medium">{project.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(project.updated_at)}</span>
                  </Link>
                ))}
                {!projects.data?.length ? (
                  <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No projects yet.{" "}
                    <Link to="/projects" className="font-medium text-primary hover:underline">
                      Create your first project
                    </Link>
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System health + quick links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">System health</h2>
              <p className="text-sm text-muted-foreground">Backend connectivity</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.isError ? (
                <Alert>{getApiErrorMessage(health.error, "Could not reach backend")}</Alert>
              ) : null}
              {health.isLoading ? (
                <LoadingBlock />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge tone={healthTone}>{health.data?.status || "unavailable"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium">{health.data?.version || "–"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Timestamp</span>
                    <span className="text-sm font-medium">{formatDate(health.data?.timestamp)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Quick links</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink to="/projects" label="Open projects" />
              <QuickLink to="/tags" label="Manage tags" />
              <QuickLink to="/api-keys" label="API keys" />
              {isAdmin ? <QuickLink to="/admin" label="Admin panel" /> : null}
            </CardContent>
          </Card>
        </div>
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
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonMetric() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}
