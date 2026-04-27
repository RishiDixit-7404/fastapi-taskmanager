import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../../hooks/useComments";
import { formatDate } from "../../utils/formatDate";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState, LoadingBlock } from "../ui/Loading";
import { Textarea } from "../ui/Textarea";

const schema = z.object({ body: z.string().min(1, "Comment body is required") });

interface PendingDelete {
  id: number;
}

export function CommentThread({ taskId }: { taskId: number }) {
  const comments = useComments(taskId);
  const createMutation = useCreateComment(taskId);
  const updateMutation = useUpdateComment(taskId);
  const deleteMutation = useDeleteComment(taskId);
  const { user, isAdmin } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { body: "" },
  });

  async function addComment(values: z.infer<typeof schema>) {
    try {
      await createMutation.mutateAsync(values.body);
      form.reset({ body: "" });
      toast.success("Comment added");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not add comment"));
    }
  }

  const sorted = (comments.data || [])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="space-y-5">
      {/* Add comment form */}
      <form className="space-y-3" onSubmit={form.handleSubmit(addComment)}>
        <Textarea
          placeholder="Add a comment…"
          rows={3}
          {...form.register("body")}
        />
        {form.formState.errors.body ? (
          <p className="field-error">{form.formState.errors.body.message}</p>
        ) : null}
        <Button type="submit" disabled={createMutation.isPending}>
          <MessageSquare className="h-4 w-4" />
          {createMutation.isPending ? "Adding…" : "Add comment"}
        </Button>
      </form>

      {comments.isLoading ? <LoadingBlock /> : null}
      {comments.isError ? <Alert>{getApiErrorMessage(comments.error, "Could not load comments")}</Alert> : null}
      {!comments.isLoading && !comments.isError && !sorted.length ? (
        <EmptyState message="No comments yet. Be the first to comment." />
      ) : null}

      <div className="space-y-3">
        {sorted.map((comment) => {
          const canEdit = user?.id === comment.author_id;
          const canDelete = canEdit || isAdmin;
          return (
            <article key={comment.id} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Author #{comment.author_id}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</div>
                </div>
                <div className="flex gap-1">
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingId(editingId === comment.id ? null : comment.id)}
                      aria-label="Edit comment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete({ id: comment.id })}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {editingId === comment.id ? (
                <EditComment
                  body={comment.body}
                  onCancel={() => setEditingId(null)}
                  onSave={async (body) => {
                    try {
                      await updateMutation.mutateAsync({ id: comment.id, body });
                      setEditingId(null);
                      toast.success("Comment updated");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Could not update comment"));
                    }
                  }}
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this comment?"
        description="This comment will be permanently removed and cannot be recovered."
        confirmLabel="Delete comment"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteMutation.mutateAsync(pendingDelete.id);
            toast.success("Comment deleted");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete comment"));
          } finally {
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}

function EditComment({
  body,
  onCancel,
  onSave,
}: {
  body: string;
  onCancel: () => void;
  onSave: (body: string) => Promise<void>;
}) {
  const [value, setValue] = useState(body);
  return (
    <div className="mt-3 space-y-3">
      <Textarea
        value={value}
        rows={3}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={() => onSave(value)} disabled={!value.trim()}>
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
