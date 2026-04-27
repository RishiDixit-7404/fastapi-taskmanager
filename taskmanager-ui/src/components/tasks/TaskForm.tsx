import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import type { TaskPriority, TaskResponse, TaskStatus, UserResponse } from "../../types/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
});

export type TaskFormValues = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: number | null;
  due_date?: string | null;
};

interface TaskFormProps {
  task?: TaskResponse;
  users?: UserResponse[];
  submitLabel: string;
  defaultStatus?: TaskStatus;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
}

export function TaskForm({ task, users = [], submitLabel, defaultStatus, onSubmit }: TaskFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults(task, defaultStatus),
  });

  useEffect(() => {
    form.reset(formDefaults(task));
  }, [form, task]);

  async function handleSubmit(values: z.infer<typeof schema>) {
    await onSubmit({
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      assignee_id: values.assignee_id ? Number(values.assignee_id) : null,
      due_date: values.due_date || null,
    });
    if (!task) {
      form.reset(formDefaults());
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <label className="label" htmlFor="task-title">
          Title
        </label>
        <Input id="task-title" {...form.register("title")} />
        {form.formState.errors.title ? <p className="field-error">{form.formState.errors.title.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="task-description">
          Description
        </label>
        <Textarea id="task-description" {...form.register("description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="label" htmlFor="task-status">
            Status
          </label>
          <Select id="task-status" {...form.register("status")}>
            <option value="todo">todo</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="blocked">blocked</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="task-priority">
            Priority
          </label>
          <Select id="task-priority" {...form.register("priority")}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="label" htmlFor="task-assignee">
            Assignee
          </label>
          <Select id="task-assignee" {...form.register("assignee_id")}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="task-due">
            Due date
          </label>
          <Input id="task-due" type="date" {...form.register("due_date")} />
        </div>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function formDefaults(task?: TaskResponse, defaultStatus?: TaskStatus): z.infer<typeof schema> {
  return {
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || defaultStatus || "todo",
    priority: task?.priority || "medium",
    assignee_id: task?.assignee_id ? String(task.assignee_id) : "",
    due_date: task?.due_date || "",
  };
}
