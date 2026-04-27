import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from "../../hooks/useComments";
import { formatDate } from "../../utils/formatDate";
import { Button } from "../ui/Button";
import { EmptyState, LoadingBlock } from "../ui/Loading";
import { Textarea } from "../ui/Textarea";

const schema = z.object({ body: z.string().min(1, "Comment body is required") });

export function CommentThread({ taskId }: { taskId: number }) {
  const comments = useComments(taskId);
  const createMutation = useCreateComment(taskId);
  const updateMutation = useUpdateComment(taskId);
  const deleteMutation = useDeleteComment(taskId);
  const { user, isAdmin } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
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

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={form.handleSubmit(addComment)}>
        <Textarea placeholder="Add a comment" {...form.register("body")} />
        {form.formState.errors.body ? <p className="field-error">{form.formState.errors.body.message}</p> : null}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding..." : "Add comment"}
        </Button>
      </form>

      {comments.isLoading ? <LoadingBlock /> : null}
      {!comments.isLoading && !comments.data?.length ? <EmptyState message="No comments yet." /> : null}
      <div className="space-y-3">
        {(comments.data || [])
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((comment) => {
            const canEdit = user?.id === comment.author_id;
            const canDelete = canEdit || isAdmin;
            return (
              <article key={comment.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Author #{comment.author_id}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    {canEdit ? (
                      <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => setEditingId(comment.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        className="h-8 w-8 px-0 text-destructive"
                        onClick={async () => {
                          if (!window.confirm("Delete this comment?")) return;
                          try {
                            await deleteMutation.mutateAsync(comment.id);
                            toast.success("Comment deleted");
                          } catch (error) {
                            toast.error(getApiErrorMessage(error, "Could not delete comment"));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
                  <p className="mt-3 whitespace-pre-wrap text-sm">{comment.body}</p>
                )}
              </article>
            );
          })}
      </div>
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
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} />
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
