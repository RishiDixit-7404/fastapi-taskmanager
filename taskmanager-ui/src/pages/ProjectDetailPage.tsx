import { ArrowLeft, Kanban, List, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { ProjectForm } from "../components/projects/ProjectForm";
import { ProjectStatusBadge } from "../components/projects/ProjectStatusBadge";
import { PriorityBadge } from "../components/tasks/PriorityBadge";
import { StatusBadge } from "../components/tasks/StatusBadge";
import { TaskForm } from "../components/tasks/TaskForm";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { useAuth } from "../hooks/useAuth";
import { useDeleteProject, usePatchProject, useProject, useUpdateProject } from "../hooks/useProjects";
import { useCreateTask, useDeleteTask, usePatchTaskStatus, useProjectTasks } from "../hooks/useTasks";
import { useUsers } from "../hooks/useUsers";
import type { ProjectStatus, TaskResponse, TaskStatus } from "../types/api";
import { formatShortDate } from "../utils/formatDate";

const statuses: TaskStatus[] = ["todo", "in_progress", "done", "blocked"];

export function ProjectDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [view, setView] = useState<"list" | "kanban">("list");
  const project = useProject(id);
  const tasks = useProjectTasks(id);
  const users = useUsers(undefined, isAdmin);
  const updateProject = useUpdateProject(id);
  const patchProject = usePatchProject(id);
  const deleteProject = useDeleteProject();
  const createTask = useCreateTask(id);
  const deleteTask = useDeleteTask(id);

  if (project.isLoading) {
    return <LoadingBlock />;
  }

  if (!project.data) {
    return <EmptyState message="Project could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" to="/projects">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <ProjectStatusBadge status={project.data.status} />
            <h2 className="mt-3 text-3xl font-semibold">{project.data.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{project.data.description || "No description"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              PUT edit
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!window.confirm("Delete this project and all of its tasks?")) return;
                try {
                  await deleteProject.mutateAsync(project.data.id);
                  toast.success("Project deleted");
                  navigate("/projects");
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Could not delete project"));
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">PATCH project status</h3>
            <p className="text-sm text-muted-foreground">Single-field update using the PATCH endpoint.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={project.data.status}
              onChange={async (event) => {
                try {
                  await patchProject.mutateAsync({ status: event.target.value as ProjectStatus });
                  toast.success("Project status patched");
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Could not patch project"));
                }
              }}
            >
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Tasks</h3>
                <p className="text-sm text-muted-foreground">List and kanban views share the same backend data.</p>
              </div>
              <div className="flex gap-2">
                <Button variant={view === "list" ? "primary" : "outline"} onClick={() => setView("list")}>
                  <List className="h-4 w-4" />
                  List
                </Button>
                <Button variant={view === "kanban" ? "primary" : "outline"} onClick={() => setView("kanban")}>
                  <Kanban className="h-4 w-4" />
                  Kanban
                </Button>
                <Button onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Task
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.isLoading ? <LoadingBlock /> : null}
            {!tasks.isLoading && !tasks.data?.length ? <EmptyState message="No tasks yet." /> : null}
            {view === "list" ? (
              <div className="space-y-3">
                {(tasks.data || []).map((task) => (
                  <TaskRow key={task.id} task={task} projectId={id} onDelete={(taskId) => deleteTask.mutateAsync(taskId)} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-4">
                {statuses.map((status) => (
                  <div key={status} className="rounded-lg border bg-muted/30 p-3">
                    <div className="mb-3 font-semibold">{status}</div>
                    <div className="space-y-3">
                      {(tasks.data || [])
                        .filter((task) => task.status === status)
                        .map((task) => (
                          <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-lg border bg-card p-3 hover:bg-muted">
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-2 flex gap-2">
                              <PriorityBadge priority={task.priority} />
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={editOpen} title="PUT full project update" onClose={() => setEditOpen(false)}>
        <ProjectForm
          project={project.data}
          submitLabel="Save full update"
          onSubmit={async (values) => {
            try {
              await updateProject.mutateAsync({
                title: values.title,
                description: values.description || null,
                status: values.status,
              });
              setEditOpen(false);
              toast.success("Project updated");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not update project"));
            }
          }}
        />
      </Modal>

      <Modal open={createTaskOpen} title="Create task" onClose={() => setCreateTaskOpen(false)}>
        <TaskForm
          users={isAdmin ? users.data : []}
          submitLabel="Create task"
          onSubmit={async (values) => {
            try {
              await createTask.mutateAsync(values);
              setCreateTaskOpen(false);
              toast.success("Task created");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not create task"));
            }
          }}
        />
      </Modal>
    </div>
  );
}

function TaskRow({
  task,
  projectId,
  onDelete,
}: {
  task: TaskResponse;
  projectId: number;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const patchStatus = usePatchTaskStatus(task.id, projectId);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link to={`/tasks/${task.id}`} className="font-semibold hover:text-primary">
          {task.title}
        </Link>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="text-xs text-muted-foreground">Due {formatShortDate(task.due_date)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Select
          className="w-40"
          value={task.status}
          onChange={async (event) => {
            try {
              await patchStatus.mutateAsync(event.target.value as TaskStatus);
              toast.success("Task status patched");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not patch task status"));
            }
          }}
        >
          <option value="todo">todo</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
          <option value="blocked">blocked</option>
        </Select>
        <Button
          variant="ghost"
          className="h-10 w-10 px-0 text-destructive"
          onClick={async () => {
            if (!window.confirm(`Delete task "${task.title}"?`)) return;
            try {
              await onDelete(task.id);
              toast.success("Task deleted");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not delete task"));
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
