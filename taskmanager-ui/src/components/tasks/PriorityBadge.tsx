import { Badge } from "../ui/Badge";
import type { TaskPriority } from "../../types/api";

const priorityTone: Record<TaskPriority, "blue" | "slate" | "amber" | "red"> = {
  low: "blue",
  medium: "slate",
  high: "amber",
  critical: "red",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={priorityTone[priority]}>{priority}</Badge>;
}
