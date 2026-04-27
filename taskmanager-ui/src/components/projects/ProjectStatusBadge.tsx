import { Badge } from "../ui/Badge";
import type { ProjectStatus } from "../../types/api";

const statusTone: Record<ProjectStatus, "blue" | "amber" | "green" | "slate"> = {
  active: "blue",
  on_hold: "amber",
  completed: "green",
  archived: "slate",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}
