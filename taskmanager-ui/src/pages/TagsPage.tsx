import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { useAuth } from "../hooks/useAuth";
import { useCreateTag, useDeleteTag, useTags } from "../hooks/useTags";

const schema = z.object({
  name: z.string().min(1, "Tag name is required"),
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #334155"),
});

export function TagsPage() {
  const { isAdmin } = useAuth();
  const tags = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", colour: "#334155" },
  });

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
              <Input id="tag-name" {...form.register("name")} />
              {form.formState.errors.name ? <p className="field-error">{form.formState.errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="tag-colour">
                Colour
              </label>
              <Input id="tag-colour" type="color" className="h-12 p-1" {...form.register("colour")} />
              {form.formState.errors.colour ? (
                <p className="field-error">{form.formState.errors.colour.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create tag"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Tag catalog</h2>
          <p className="text-sm text-muted-foreground">Admin users can delete shared tags.</p>
        </CardHeader>
        <CardContent>
          {tags.isLoading ? <LoadingBlock /> : null}
          {!tags.isLoading && !tags.data?.length ? <EmptyState message="No tags have been created." /> : null}
          <div className="flex flex-wrap gap-3">
            {(tags.data || []).map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 rounded-full border bg-background py-1 pl-2 pr-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.colour }} />
                <span className="text-sm font-medium">{tag.name}</span>
                {isAdmin ? (
                  <Button
                    variant="ghost"
                    className="h-7 w-7 rounded-full px-0 text-destructive"
                    onClick={async () => {
                      if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
                      try {
                        await deleteMutation.mutateAsync(tag.id);
                        toast.success("Tag deleted");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Could not delete tag"));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
