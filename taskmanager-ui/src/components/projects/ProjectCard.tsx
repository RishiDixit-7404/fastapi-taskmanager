import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { ProjectResponse } from "../../types/api";
import { formatDate } from "../../utils/formatDate";
import { Button } from "../ui/Button";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

interface ProjectCardProps {
  project: ProjectResponse;
  onDelete: (project: ProjectResponse) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <article className="group flex flex-col rounded-lg border bg-card p-4 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ProjectStatusBadge status={project.status} />
          <Link
            to={`/projects/${project.id}`}
            className="mt-2 block truncate text-base font-semibold hover:text-primary"
          >
            {project.title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {project.description || "No description"}
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 w-8 shrink-0 px-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={() => onDelete(project)}
          aria-label={`Delete ${project.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-auto border-t pt-3 text-xs text-muted-foreground">
        Updated {formatDate(project.updated_at)}
      </div>
    </article>
  );
}
