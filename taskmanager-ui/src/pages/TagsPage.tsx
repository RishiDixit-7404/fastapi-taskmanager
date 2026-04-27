import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Input } from "../components/ui/Input";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { useCreateTag, useDeleteTag, useTags } from "../hooks/useTags";
import type { TagResponse } from "../types/api";

const schema = z.object({
  name: z.string().min(1, "Tag name is required"),
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #334155"),
});

export function TagsPage() {
  const { isAdmin } = useAuth();
  const tags = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();
  const [toDelete, setToDelete] = useState<TagResponse | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", colour: "#334155" },
  });
  const watchedColour = form.watch("colour");

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await createMutation.mutateAsync(values);
      form.reset({ name: "", colour: "#334155" });
      toast.success("Tag created");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create tag"));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Create form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create tag</h2>
          <p className="text-sm text-muted-foreground">Tags are shared across the workspace.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="label" htmlFor="tag-name">
                Name
              </label>
              <Input id="tag-name" placeholder="e.g. bug, feature, urgent" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="field-error">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="tag-colour">
                Colour
              </label>
              <div className="flex gap-3">
                <Input
                  id="tag-colour"
                  type="color"
                  className="h-10 w-14 cursor-pointer p-1"
                  {...form.register("colour")}
                />
                <Input
                  placeholder="#334155"
                  value={watchedColour}
                  onChange={(e) => form.setValue("colour", e.target.value)}
                  className="font-mono"
                />
              </div>
              {form.formState.errors.colour ? (
                <p className="field-error">{form.formState.errors.colour.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "Creating…" : "Create tag"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tag catalog */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Tag catalog</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Admin: click × to delete a tag." : "Tags available across the workspace."}
          </p>
        </CardHeader>
        <CardContent>
          {tags.isError ? <Alert>{getApiErrorMessage(tags.error, "Could not load tags")}</Alert> : null}
          {tags.isLoading ? <LoadingBlock /> : null}
          {!tags.isLoading && !tags.isError && !tags.data?.length ? (
            <EmptyState message="No tags yet. Create the first tag using the form." />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(tags.data || []).map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 rounded-full border bg-background py-1.5 pl-3 pr-2 transition hover:shadow-sm"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: tag.colour }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
                {isAdmin ? (
                  <button
                    type="button"
                    className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive hover:text-white"
                    aria-label={`Delete ${tag.name}`}
                    onClick={() => setToDelete(tag)}
                  >
                    <span className="text-xs leading-none">×</span>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete tag "${toDelete?.name}"?`}
        description="This tag will be removed from all tasks that use it. This action cannot be undone."
        confirmLabel="Delete tag"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteMutation.mutateAsync(toDelete.id);
            toast.success("Tag deleted");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not delete tag"));
          } finally {
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}
