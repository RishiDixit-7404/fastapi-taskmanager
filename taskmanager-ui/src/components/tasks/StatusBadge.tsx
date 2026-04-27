import { Badge } from "../ui/Badge";
import type { TaskStatus } from "../../types/api";

const statusTone: Record<TaskStatus, "slate" | "amber" | "green" | "red"> = {
  todo: "slate",
  in_progress: "amber",
  done: "green",
  blocked: "red",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}
