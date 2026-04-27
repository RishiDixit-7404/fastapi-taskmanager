import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "../api/client";
import { CommentThread } from "../components/comments/CommentThread";
import { PriorityBadge } from "../components/tasks/PriorityBadge";
import { StatusBadge } from "../components/tasks/StatusBadge";
import { TaskForm } from "../components/tasks/TaskForm";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
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
  const task = useTask(taskId);
  const project = useProject(task.data?.project_id || NaN);
  const users = useUsers(undefined, isAdmin);
  const tags = useTags();
  const updateTask = useUpdateTask(taskId, task.data?.project_id);
  const patchStatus = usePatchTaskStatus(taskId, task.data?.project_id);
  const deleteTask = useDeleteTask(task.data?.project_id);
  const attach = useAttachTag(taskId);
  const detach = useDetachTag(taskId);

  if (task.isLoading) {
    return <LoadingBlock />;
  }

  if (!task.data) {
    return <EmptyState message="Task could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        to={`/projects/${task.data.project_id}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to project
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.data.status} />
              <PriorityBadge priority={task.data.priority} />
            </div>
            <h2 className="mt-3 text-3xl font-semibold">{task.data.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{task.data.description || "No description"}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Project" value={project.data?.title || `Project #${task.data.project_id}`} />
              <Meta label="Assignee" value={task.data.assignee_id ? `User #${task.data.assignee_id}` : "Unassigned"} />
              <Meta label="Due" value={formatShortDate(task.data.due_date)} />
              <Meta label="Updated" value={formatDate(task.data.updated_at)} />
            </dl>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              PUT edit
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!window.confirm("Delete this task?")) return;
                try {
                  await deleteTask.mutateAsync(task.data.id);
                  toast.success("Task deleted");
                  navigate(`/projects/${task.data.project_id}`);
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Could not delete task"));
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">PATCH task status</h3>
              <p className="text-sm text-muted-foreground">Single-field task status update.</p>
            </CardHeader>
            <CardContent>
              <Select
                value={task.data.status}
                onChange={async (event) => {
                  try {
                    await patchStatus.mutateAsync(event.target.value as TaskStatus);
                    toast.success("Task status patched");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, "Could not patch task"));
                  }
                }}
              >
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Tags</h3>
              <p className="text-sm text-muted-foreground">The backend accepts attach and detach actions by tag ID.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.isLoading ? <LoadingBlock /> : null}
              {!tags.isLoading && !tags.data?.length ? <EmptyState message="No tags available." /> : null}
              {(tags.data || []).map((tag) => (
                <div key={tag.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.colour }} />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await attach.mutateAsync(tag.id);
                          toast.success("Tag attach requested");
                        } catch (error) {
                          toast.error(getApiErrorMessage(error, "Could not attach tag"));
                        }
                      }}
                    >
                      Attach
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await detach.mutateAsync(tag.id);
                          toast.success("Tag detach requested");
                        } catch (error) {
                          toast.error(getApiErrorMessage(error, "Could not detach tag"));
                        }
                      }}
                    >
                      Detach
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">Comments</h3>
            <p className="text-sm text-muted-foreground">Authors can edit; authors and admins can delete.</p>
          </CardHeader>
          <CardContent>
            <CommentThread taskId={task.data.id} />
          </CardContent>
        </Card>
      </div>

      <Modal open={editOpen} title="PUT full task update" onClose={() => setEditOpen(false)}>
        <TaskForm
          task={task.data}
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
