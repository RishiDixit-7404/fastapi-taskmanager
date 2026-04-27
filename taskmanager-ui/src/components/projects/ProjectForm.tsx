import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import type { ProjectResponse, ProjectStatus } from "../../types/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]),
});

export type ProjectFormValues = z.infer<typeof schema>;

interface ProjectFormProps {
  project?: ProjectResponse;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
}

export function ProjectForm({ project, submitLabel, onSubmit }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      status: project?.status || "active",
    },
  });

  useEffect(() => {
    form.reset({
      title: project?.title || "",
      description: project?.description || "",
      status: project?.status || "active",
    });
  }, [form, project]);

  async function handleSubmit(values: ProjectFormValues) {
    await onSubmit({
      ...values,
      description: values.description || "",
      status: values.status as ProjectStatus,
    });
    if (!project) {
      form.reset({ title: "", description: "", status: "active" });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <label className="label" htmlFor="project-title">
          Title
        </label>
        <Input id="project-title" {...form.register("title")} />
        {form.formState.errors.title ? <p className="field-error">{form.formState.errors.title.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="project-description">
          Description
        </label>
        <Textarea id="project-description" {...form.register("description")} />
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="project-status">
          Status
        </label>
        <Select id="project-status" {...form.register("status")}>
          <option value="active">active</option>
          <option value="on_hold">on_hold</option>
          <option value="completed">completed</option>
          <option value="archived">archived</option>
        </Select>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
