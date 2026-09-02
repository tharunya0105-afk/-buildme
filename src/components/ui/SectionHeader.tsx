import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  badge,
  badgeColor = "bg-accent/10 text-accent",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-alt">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-title font-semibold text-text-primary">{title}</h2>
          {subtitle && (
            <p className="text-caption text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && (
        <span className={`text-micro px-2.5 py-1 rounded-full font-medium ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
