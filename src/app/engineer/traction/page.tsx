"use client";

// ─── Traction Dashboard ─────────────────────────────────────────────────────
// The four numbers every funding committee asks for, computed live from the
// product database with exact definitions shown. No vanity metrics — honest
// zeros are displayed as zeros.

import { useEffect, useState } from "react";
import {
  Users, Milestone, Scale, Activity, Copy, Check, RefreshCw,
  TrendingUp, TrendingDown, Minus, Loader2, ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { TractionData } from "@/lib/traction";
import { formatInr } from "@/lib/traction";

// ─── Small building blocks ──────────────────────────────────────────────────

function Kpi({ icon: Icon, label, value, sub, tone = "default" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-text-primary";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Icon className="h-4 w-4 text-accent" />
          {label}
        </div>
        <p className={`text-3xl font-bold mt-2 ${toneClass}`}>{value}</p>
        {sub && <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Definition({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-text-muted mt-2 leading-relaxed border-t border-border pt-2">
      <span className="font-semibold text-text-secondary">Definition: </span>
      {children}
    </p>
  );
}

function VariancePill({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  const cls = abs <= 10 ? "bg-emerald-50 text-emerald-700" : abs <= 25 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{pct > 0 ? "+" : ""}{pct}%</span>;
}

function WeekChart({ weeks }: { weeks: TractionData["usage"]["weeks"] }) {
  const max = Math.max(...weeks.map(w => w.activeUsers), 1);
  return (
    <div className="flex items-end gap-2 h-28 mt-3">
      {weeks.map(w => {
        const h = Math.max(4, Math.round((w.activeUsers / max) * 100));
        const label = new Date(w.weekStart + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
        return (
          <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-1" title={`${w.activeUsers} active · ${w.events} events · week of ${w.weekStart}`}>
            <span className="text-[10px] text-text-muted">{w.activeUsers}</span>
            <div
              className={`w-full rounded-t ${w.activeUsers > 0 ? "bg-accent" : "bg-border"}`}
              style={{ height: `${h}%` }}
            />
            <span className="text-[9px] text-text-muted whitespace-nowrap">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TractionPage() {
  const [data, setData] = useState<TractionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/traction");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        if (alive) setData(json);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load traction metrics");
      }
    })();
    return () => { alive = false; };
  }, []);

  const copySummary = async () => {
    if (!data) return;
    const d = new Date(data.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const lines = [
      `BuildMe — Traction (live from product, ${d})`,
      ``,
      `Engineers onboarded: ${data.engineers.onboarded} (activated with ≥1 project: ${data.engineers.activated})`,
      `Pilot engineers: ${data.pilots.total} total · ${data.pilots.active} active · ${data.pilots.completed} completed · ${data.pilots.validated} validated`,
      `Verified milestones: ${data.milestones.verifiedObservations}/${data.milestones.totalObservations} observations engineer-verified · ${data.milestones.evidenceItems} evidence docs (${data.milestones.independentlyVerifiedEvidence} independently verified) · ${formatInr(data.milestones.paymentAmountPaidInr)} paid across ${data.milestones.paymentRequestsPaid} milestone payments`,
      `Estimated-vs-actual pairs: ${data.costPairs.count} projects · mean |variance| ${data.costPairs.meanAbsVariancePct ?? "—"}%`,
      `Weekly active users: ${data.usage.wau} this week (${data.usage.wauPrev} last week) · ${data.usage.totalEvents} product events all-time`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-8 text-center text-sm text-text-muted">{error}</CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const wauDelta = data.usage.wau - data.usage.wauPrev;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent" /> Traction
          </h1>
          <p className="text-sm text-text-muted mt-1">
            The metrics funding committees ask for — computed live from the product, definitions included.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.location.reload()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button onClick={copySummary} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy summary"}
          </Button>
          <a
            href="/deck"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text-primary hover:bg-surface-alt"
          >
            Investor deck ↗
          </a>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          icon={Users}
          label="Engineers onboarded"
          value={String(data.engineers.onboarded)}
          sub={`${data.engineers.activated} activated (created ≥1 project)`}
        />
        <Kpi
          icon={Milestone}
          label="Pilot engineers"
          value={`${data.pilots.active}/${data.pilots.total}`}
          sub={`${data.pilots.completed} completed · ${data.pilots.validated} validated`}
        />
        <Kpi
          icon={ShieldCheck}
          label="Verified milestones"
          value={String(data.milestones.paymentRequestsPaid)}
          sub={`${formatInr(data.milestones.paymentAmountPaidInr)} paid · ${data.milestones.verifiedObservations}/${data.milestones.totalObservations} observations verified`}
        />
        <Kpi
          icon={Scale}
          label="Estimated-vs-actual pairs"
          value={String(data.costPairs.count)}
          sub={data.costPairs.meanAbsVariancePct !== null ? `Mean |variance| ${data.costPairs.meanAbsVariancePct}%` : "No completed pairs yet"}
          tone={data.costPairs.count > 0 ? "good" : "default"}
        />
      </div>

      {/* Usage + funnel row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" /> Weekly active usage
              </h2>
              <span className="text-xs text-text-muted flex items-center gap-1">
                WAU {data.usage.wau}
                {wauDelta > 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  : wauDelta < 0 ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  : <Minus className="h-3.5 w-3.5 text-text-muted" />}
                <span className="ml-1">{wauDelta === 0 ? "flat" : `${wauDelta > 0 ? "+" : ""}${wauDelta}`} vs last week</span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <WeekChart weeks={data.usage.weeks} />
            <Definition>
              Distinct users with ≥1 product event in the ISO week (Mon–Sun). Last 8 weeks shown; {data.usage.totalEvents} events all-time.
            </Definition>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" /> Pilot funnel
            </h2>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex h-3 rounded-full overflow-hidden mt-3 bg-border">
              {Object.entries(data.pilots.byStatus).map(([status, n]) => (
                <div key={status} className="bg-accent/80" style={{ width: `${(n / Math.max(1, data.pilots.total)) * 100}%` }} title={`${status}: ${n}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-text-muted">
              {Object.entries(data.pilots.byStatus).map(([status, n]) => (
                <span key={status}><span className="font-medium text-text-secondary">{status}</span> · {n}</span>
              ))}
              {data.pilots.total === 0 && <span>No pilots recorded yet — add them in Pilot Center.</span>}
            </div>
            <Definition>
              Pilot lifecycle: prospect → screened → selected → onboarding → baseline → active → midpoint → completed → validated. &ldquo;Validated&rdquo; means success criteria were met and signed off.
            </Definition>
          </CardContent>
        </Card>
      </div>

      {/* Cost pairs table */}
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent" /> Estimated-vs-actual cost pairs
            <span className="text-xs font-normal text-text-muted">— the corpus moat</span>
          </h2>
        </CardHeader>
        <CardContent className="pt-2">
          {data.costPairs.rows.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No pairs yet — a pair forms when a project has a priced quotation <em>and</em> recorded actual costs (payments / material / labour).
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted border-b border-border">
                    <th className="py-2 pr-3 font-medium">Project</th>
                    <th className="py-2 pr-3 font-medium text-right">Estimated</th>
                    <th className="py-2 pr-3 font-medium text-right">Actual so far</th>
                    <th className="py-2 pr-3 font-medium text-right">Variance</th>
                    <th className="py-2 font-medium text-right">Data points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.costPairs.rows.map(r => (
                    <tr key={r.projectId} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-text-primary">{r.projectName}</span>
                        {r.city && <span className="text-text-muted"> · {r.city}</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatInr(r.estimatedInr)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatInr(r.actualInr)}</td>
                      <td className="py-2.5 pr-3 text-right"><VariancePill pct={r.variancePct} /></td>
                      <td className="py-2.5 text-right text-xs text-text-muted tabular-nums">{r.quotationCount}Q · {r.actualEventCount}A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Definition>
            Per project: latest priced quotation total vs sum of recorded payment / material / labour events. Variance = (actual − estimated) ÷ estimated. Actuals grow as the project runs — pairs are &ldquo;live&rdquo;, not final.
          </Definition>
        </CardContent>
      </Card>

      {/* Engineer roster */}
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" /> Engineer roster
          </h2>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-border">
                  <th className="py-2 pr-3 font-medium">Engineer</th>
                  <th className="py-2 pr-3 font-medium text-right">Projects</th>
                  <th className="py-2 font-medium text-right">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {data.engineers.rows.map(e => (
                  <tr key={e.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-text-primary">{e.name}</span>
                      <span className="text-text-muted text-xs ml-2">{e.email}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{e.projectsCount}</td>
                    <td className="py-2.5 text-right text-xs text-text-muted">
                      {e.lastActiveAt ? new Date(e.lastActiveAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Definition>
            Onboarded = account with engineer role. Activated = has created at least one project.
          </Definition>
        </CardContent>
      </Card>

      <p className="text-[11px] text-text-muted text-center pb-2">
        All numbers are queried live from the product database — nothing hand-entered. Generated {new Date(data.generatedAt).toLocaleString("en-IN")}.
      </p>
    </div>
  );
}
