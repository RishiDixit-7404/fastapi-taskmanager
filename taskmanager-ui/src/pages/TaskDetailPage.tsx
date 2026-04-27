import { ArrowLeft, Check, Pencil, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { CommentThread } from "../components/comments/CommentThread";
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
import { useProject } from "../hooks/useProjects";
import { useAttachTag, useDeleteTask, useDetachTag, usePatchTaskStatus, useTask, useUpdateTask } from "../hooks/useTasks";
import { useTags } from "../hooks/useTags";
import { useUsers } from "../hooks/useUsers";
import type { TaskStatus } from "../types/api";
import { formatDate, formatShortDate } from "../utils/formatDate";

export function TaskDetailPage() {
  const taskId = Number(useParams().id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const task = useTask(taskId);
  const project = useProject(task.data?.project_id || NaN);
  const users = useUsers(undefined, isAdmin);
  const tags = useTags();
  const updateTask = useUpdateTask(taskId, task.data?.project_id);
  const patchStatus = usePatchTaskStatus(taskId, task.data?.project_id);
  const deleteTask = useDeleteTask(task.data?.project_id);
  const attach = useAttachTag(taskId);
  const detach = useDetachTag(taskId);

  if (task.isLoading) return <LoadingBlock />;
  if (task.isError) return <Alert>{getApiErrorMessage(task.error, "Could not load task")}</Alert>;
  if (!task.data) return <EmptyState message="Task could not be loaded." />;

  const currentTask = task.data;

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        to={`/projects/${currentTask.project_id}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to project
      </Link>

      {/* Task header */}
      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={currentTask.status} />
              <PriorityBadge priority={currentTask.priority} />
            </div>
            <h2 className="mt-3 text-3xl font-semibold">{currentTask.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{currentTask.description || "No description"}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Project" value={project.data?.title || `Project #${currentTask.project_id}`} />
              <Meta label="Assignee" value={currentTask.assignee_id ? `User #${currentTask.assignee_id}` : "Unassigned"} />
              <Meta label="Due" value={formatShortDate(currentTask.due_date)} />
              <Meta label="Updated" value={formatDate(currentTask.updated_at)} />
            </dl>
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

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          {/* PATCH status */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">PATCH task status</h3>
              <p className="text-sm text-muted-foreground">Single-field update via the PATCH endpoint.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={currentTask.status}
                onChange={async (e) => {
                  try {
                    await patchStatus.mutateAsync(e.target.value as TaskStatus);
                    toast.success("Task status updated");
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
              <p className="text-xs text-muted-foreground">
                Sends only <code className="rounded bg-muted px-1">{"{ status }"}</code> — partial update via PATCH.
              </p>
            </CardContent>
          </Card>

          {/* Tag selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Tags</h3>
              </div>
              <p className="text-sm text-muted-foreground">Attach or detach tags on this task.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {tags.isError ? <Alert>{getApiErrorMessage(tags.error, "Could not load tags")}</Alert> : null}
              {tags.isLoading ? <LoadingBlock /> : null}
              {!tags.isLoading && !tags.isError && !tags.data?.length ? (
                <EmptyState message="No tags available. Create tags from the Tags page." />
              ) : null}
              {(tags.data || []).map((tag) => (
                <div key={tag.id} className="flex items-center justify-between rounded-lg border bg-background p-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: tag.colour }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      className="h-8 gap-1.5 px-2.5 text-xs"
                      onClick={async () => {
                        try {
                          await attach.mutateAsync(tag.id);
                          toast.success(`"${tag.name}" attached`);
                        } catch (error) {
                          toast.error(getApiErrorMessage(error, "Could not attach tag"));
                        }
                      }}
                    >
                      <Check className="h-3 w-3" />
                      Attach
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        try {
                          await detach.mutateAsync(tag.id);
                          toast.success(`"${tag.name}" detached`);
                        } catch (error) {
                          toast.error(getApiErrorMessage(error, "Could not detach tag"));
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                      Detach
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Comments */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Comments</h3>
            <p className="text-sm text-muted-foreground">Authors can edit; authors and admins can delete.</p>
          </CardHeader>
          <CardContent>
            <CommentThread taskId={currentTask.id} />
          </CardContent>
        </Card>
      </div>

      {/* PUT edit modal */}
      <Modal open={editOpen} title="PUT full task update" onClose={() => setEditOpen(false)}>
        <TaskForm
          task={currentTask}
          users={isAdmin ? users.data : []}
          submitLabel="Save full update"
          onSubmit={async (values) => {
            try {
              await updateTask.mutateAsync(values);
              setEditOpen(false);
              toast.success("Task updated");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Could not update task"));
            }
          }}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this task?"
        description="This task and all of its comments will be permanently deleted."
        confirmLabel="Delete task"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteTask.mutateAsync(currentTask.id);
            toast.success("Task deleted");
            navigate(`/projects/${currentTask.project_id}`);
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete task"));
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
