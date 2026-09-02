import { ReactNode } from "react";
import { HardHat } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt mb-4">
        {icon || <HardHat className="h-8 w-8 text-text-muted" />}
      </div>

      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>

      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>

      {action && <div>{action}</div>}
    </div>
  );
}
