// ─── Traction Metrics (shared types) ────────────────────────────────────────
// The four numbers every funding committee asks for, computed live from the
// product database. Definitions are deliberately strict and shown in the UI —
// a committee should be able to audit every number.

export interface EngineerRow {
  id: string;
  name: string;
  email: string;
  projectsCount: number;
  lastActiveAt: string | null;
}

export interface PilotFunnel {
  total: number;
  byStatus: Record<string, number>;
  active: number;     // status "active" | "midpoint"
  completed: number;  // status "completed" | "validated"
  validated: number;  // status "validated" only
}

export interface MilestoneStats {
  paymentRequests: number;
  paymentRequestsPaid: number;
  paymentAmountPaidInr: number;
  verifiedObservations: number;
  totalObservations: number;
  evidenceItems: number;
  independentlyVerifiedEvidence: number;
}

export interface CostPair {
  projectId: string;
  projectName: string;
  city: string | null;
  estimatedInr: number;
  actualInr: number;
  variancePct: number;      // (actual − estimated) / estimated × 100
  quotationCount: number;
  actualEventCount: number;
}

export interface WeekBucket {
  weekStart: string;  // ISO date of Monday
  activeUsers: number;
  events: number;
}

export interface TractionData {
  engineers: {
    onboarded: number;   // users with role "engineer"
    activated: number;   // engineers who created ≥1 project
    rows: EngineerRow[];
  };
  pilots: PilotFunnel;
  milestones: MilestoneStats;
  costPairs: {
    count: number;
    meanAbsVariancePct: number | null;
    totalEstimatedInr: number;
    totalActualInr: number;
    rows: CostPair[];
  };
  usage: {
    wau: number;             // distinct users this ISO week (Mon-start)
    wauPrev: number;         // previous week
    totalEvents: number;     // all-time product events
    weeks: WeekBucket[];     // last 8 weeks, oldest first
  };
  generatedAt: string;
}

/** Format INR compactly in Lakh / Crore (Indian convention). */
export function formatInr(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

/** ISO week start (Monday) for a date, as YYYY-MM-DD. */
export function isoWeekStart(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
