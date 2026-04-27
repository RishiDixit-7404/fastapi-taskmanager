import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

interface AlertProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ title = "Something went wrong", children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
