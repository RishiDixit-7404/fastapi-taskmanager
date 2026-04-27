import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { ProjectForm } from "../components/projects/ProjectForm";
import { ProjectStatusBadge } from "../components/projects/ProjectStatusBadge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { useCreateProject, useDeleteProject, useProjects } from "../hooks/useProjects";
import type { ProjectStatus } from "../types/api";
import { formatDate } from "../utils/formatDate";

export function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const projects = useProjects(status);
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Create, filter, open, and delete owned projects.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Project list</h3>
              <p className="text-sm text-muted-foreground">Filter by status when the workspace grows.</p>
            </div>
            <Select className="sm:w-56" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {projects.isLoading ? <LoadingBlock /> : null}
          {!projects.isLoading && !projects.data?.length ? <EmptyState message="No projects match this view." /> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(projects.data || []).map((project) => (
              <article key={project.id} className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <ProjectStatusBadge status={project.status} />
                    <Link to={`/projects/${project.id}`} className="mt-3 block text-lg font-semibold hover:text-primary">
                      {project.title}
                    </Link>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {project.description || "No description"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 px-0 text-destructive"
                    onClick={async () => {
                      if (!window.confirm(`Delete project "${project.title}" and its tasks?`)) return;
                      try {
                        await deleteMutation.mutateAsync(project.id);
                        toast.success("Project deleted");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Could not delete project"));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">Updated {formatDate(project.updated_at)}</div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal open={createOpen} title="Create project" onClose={() => setCreateOpen(false)}>
        <ProjectForm
          submitLabel="Create project"
          onSubmit={async (values) => {
            try {
              await createMutation.mutateAsync({
                title: values.title,
                description: values.description || null,
                status: values.status,
              });
              setCreateOpen(false);
              toast.success("Project created");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not create project"));
            }
          }}
        />
      </Modal>
    </div>
  );
}
