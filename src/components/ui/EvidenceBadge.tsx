interface EvidenceBadgeProps {
  type: "verified" | "reference" | "market" | "demo" | "not_validated";
  size?: "sm" | "md";
}

const badgeConfig = {
  verified: {
    label: "VERIFIED",
    cls: "bg-success-bg text-success border border-success-border",
  },
  reference: {
    label: "REFERENCE DATA",
    cls: "bg-info-bg text-info border border-info-border",
  },
  market: {
    label: "MARKET EVIDENCE",
    cls: "bg-warning-bg text-warning border border-warning-border",
  },
  demo: {
    label: "DEMO DATA",
    cls: "bg-surface-alt text-text-muted border border-border",
  },
  not_validated: {
    label: "NOT YET VALIDATED",
    cls: "bg-warning-bg text-warning border border-warning-border",
  },
};

export function EvidenceBadge({ type, size = "sm" }: EvidenceBadgeProps) {
  const config = badgeConfig[type];
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClass} ${config.cls}`}>
      {config.label}
    </span>
  );
}
