interface StatusBadgeProps {
  status: "normal" | "attention" | "review" | string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  const statusClasses: Record<string, string> = {
    normal: "status-normal",
    attention: "status-attention",
    review: "status-review",
  };

  const labels: Record<string, string> = {
    normal: "Normal",
    attention: "Attention",
    review: "Review Required",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${
        statusClasses[status] || "bg-gray-100 text-gray-600"
      } ${className}`}
      role="status"
      aria-label={`Status: ${labels[status] || status}`}
    >
      {labels[status] || status}
    </span>
  );
}
