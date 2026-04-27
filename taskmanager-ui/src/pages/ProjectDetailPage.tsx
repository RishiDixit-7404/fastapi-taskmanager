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
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
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

const columnMeta: Record<TaskStatus, { label: string; color: string; headerBg: string }> = {
  todo: { label: "To Do", color: "border-slate-400", headerBg: "bg-slate-100 dark:bg-slate-800/60" },
  in_progress: { label: "In Progress", color: "border-amber-400", headerBg: "bg-amber-50 dark:bg-amber-900/20" },
  done: { label: "Done", color: "border-emerald-500", headerBg: "bg-emerald-50 dark:bg-emerald-900/20" },
  blocked: { label: "Blocked", color: "border-red-400", headerBg: "bg-red-50 dark:bg-red-900/20" },
};

export function ProjectDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>("todo");
  const [taskToDelete, setTaskToDelete] = useState<TaskResponse | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");

  const project = useProject(id);
  const tasks = useProjectTasks(id);
  const users = useUsers(undefined, isAdmin);
  const updateProject = useUpdateProject(id);
  const patchProject = usePatchProject(id);
  const deleteProject = useDeleteProject();
  const createTask = useCreateTask(id);
  const deleteTask = useDeleteTask(id);

  if (project.isLoading) return <LoadingBlock />;
  if (project.isError) return <Alert>{getApiErrorMessage(project.error, "Could not load project")}</Alert>;
  if (!project.data) return <EmptyState message="Project could not be loaded." />;

  const currentProject = project.data;

  function openCreateTask(status: TaskStatus = "todo") {
    setCreateTaskStatus(status);
    setCreateTaskOpen(true);
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" to="/projects">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Project header */}
      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <ProjectStatusBadge status={currentProject.status} />
            <h2 className="mt-3 text-3xl font-semibold">{currentProject.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{currentProject.description || "No description"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              PUT edit
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* PATCH status card */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">PATCH project status</h3>
            <p className="text-sm text-muted-foreground">Single-field update using the PATCH endpoint.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={currentProject.status}
              onChange={async (e) => {
                try {
                  await patchProject.mutateAsync({ status: e.target.value as ProjectStatus });
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
            <p className="text-xs text-muted-foreground">
              Sends only <code className="rounded bg-muted px-1">{"{ status }"}</code> — partial update via PATCH.
            </p>
          </CardContent>
        </Card>

        {/* Tasks card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {tasks.data?.length ?? 0} task{tasks.data?.length !== 1 ? "s" : ""} in this project
                </p>
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
                <Button onClick={() => openCreateTask()}>
                  <Plus className="h-4 w-4" />
                  Task
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.isError ? <Alert>{getApiErrorMessage(tasks.error, "Could not load tasks")}</Alert> : null}
            {tasks.isLoading ? <LoadingBlock /> : null}
            {!tasks.isLoading && !tasks.isError && !tasks.data?.length ? (
              <EmptyState message="No tasks yet. Create the first task to get started." />
            ) : null}

            {view === "list" ? (
              <div className="space-y-3">
                {(tasks.data || []).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectId={id}
                    onDelete={setTaskToDelete}
                  />
                ))}
              </div>
            ) : (
              /* Kanban view */
              <div className="grid gap-4 xl:grid-cols-4">
                {statuses.map((status) => {
                  const meta = columnMeta[status];
                  const columnTasks = (tasks.data || []).filter((t) => t.status === status);
                  return (
                    <div
                      key={status}
                      className={`flex flex-col rounded-lg border-t-2 ${meta.color} bg-muted/30`}
                    >
                      <div className={`flex items-center justify-between rounded-t-sm px-3 py-2 ${meta.headerBg}`}>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {columnTasks.length}
                          </span>
                          <Button
                            variant="ghost"
                            className="h-6 w-6 px-0 text-muted-foreground hover:text-foreground"
                            onClick={() => openCreateTask(status)}
                            aria-label={`Add task to ${meta.label}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2 p-2">
                        {columnTasks.map((task) => (
                          <Link
                            key={task.id}
                            to={`/tasks/${task.id}`}
                            className="block rounded-md border bg-card p-3 text-sm transition hover:border-primary/40 hover:shadow-sm"
                          >
                            <div className="font-medium leading-snug">{task.title}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <PriorityBadge priority={task.priority} />
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground">
                                  {formatShortDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                        {columnTasks.length === 0 && (
                          <button
                            onClick={() => openCreateTask(status)}
                            className="w-full rounded-md border border-dashed p-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                          >
                            + Add task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PUT edit modal */}
      <Modal open={editOpen} title="PUT full project update" onClose={() => setEditOpen(false)}>
        <ProjectForm
          project={currentProject}
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

      {/* Create task modal */}
      <Modal open={createTaskOpen} title="Create task" onClose={() => setCreateTaskOpen(false)}>
        <TaskForm
          users={isAdmin ? users.data : []}
          submitLabel="Create task"
          defaultStatus={createTaskStatus}
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

      {/* Delete project confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this project?"
        description="This will permanently delete the project and all of its tasks. This action cannot be undone."
        confirmLabel="Delete project"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteProject.mutateAsync(currentProject.id);
            toast.success("Project deleted");
            navigate("/projects");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete project"));
            setDeleteOpen(false);
          }
        }}
      />

      {/* Delete task confirm */}
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title={`Delete "${taskToDelete?.title}"?`}
        description="This task and its comments will be permanently deleted."
        confirmLabel="Delete task"
        onCancel={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (!taskToDelete) return;
          try {
            await deleteTask.mutateAsync(taskToDelete.id);
            toast.success("Task deleted");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete task"));
          } finally {
            setTaskToDelete(null);
          }
        }}
      />
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
  onDelete: (task: TaskResponse) => void;
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
          {task.due_date && (
            <span className="text-xs text-muted-foreground">Due {formatShortDate(task.due_date)}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Select
          className="w-40"
          value={task.status}
          onChange={async (e) => {
            try {
              await patchStatus.mutateAsync(e.target.value as TaskStatus);
              toast.success("Status updated");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not update status"));
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
          className="h-10 w-10 px-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
