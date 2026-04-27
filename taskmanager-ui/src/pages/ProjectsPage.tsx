import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { ProjectCard } from "../components/projects/ProjectCard";
import { ProjectForm } from "../components/projects/ProjectForm";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { useCreateProject, useDeleteProject, useProjects } from "../hooks/useProjects";
import type { ProjectResponse, ProjectStatus } from "../types/api";

export function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectResponse | null>(null);
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
            <Select
              className="sm:w-56"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {projects.isError ? <Alert>{getApiErrorMessage(projects.error, "Could not load projects")}</Alert> : null}
          {projects.isLoading ? <LoadingBlock /> : null}
          {!projects.isLoading && !projects.isError && !projects.data?.length ? (
            <EmptyState message="No projects match this view. Create your first project to get started." />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(projects.data || []).map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={setToDelete} />
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.title}"?`}
        description="This will permanently delete the project and all of its tasks. This action cannot be undone."
        confirmLabel="Delete project"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteMutation.mutateAsync(toDelete.id);
            toast.success("Project deleted");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete project"));
          } finally {
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}
