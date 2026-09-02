interface FinancialMetricProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
}

const variantClasses = {
  default: "text-text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  accent: "text-accent",
};

const sizeClasses = {
  sm: "text-financial-md",
  md: "text-financial-lg",
  lg: "text-financial-xl",
  xl: "text-display",
};

export function FinancialMetric({
  label,
  value,
  sublabel,
  variant = "default",
  size = "md",
}: FinancialMetricProps) {
  return (
    <div className="text-center">
      <p className="text-overline text-text-muted mb-1">{label}</p>
      <p className={`${sizeClasses[size]} ${variantClasses[variant]} font-bold`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-micro text-text-muted mt-1">{sublabel}</p>
      )}
    </div>
  );
}
