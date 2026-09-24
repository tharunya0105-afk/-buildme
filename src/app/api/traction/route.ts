import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { TractionData, CostPair, WeekBucket, EngineerRow } from "@/lib/traction";
import { isoWeekStart } from "@/lib/traction";

/**
 * GET /api/traction
 * Investor-grade traction metrics, computed live from the product database.
 * Engineer-only. Every number carries its exact definition — committees audit.
 */

const ACTIVE_PILOT = ["active", "midpoint"];
const DONE_PILOT = ["completed", "validated"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "engineer") {
      return NextResponse.json({ error: "Engineer access required" }, { status: 403 });
    }

    const now = new Date();
    const thisWeek = isoWeekStart(now);
    const prevWeekDate = new Date(now);
    prevWeekDate.setUTCDate(prevWeekDate.getUTCDate() - 7);
    const prevWeek = isoWeekStart(prevWeekDate);

    // ─── Engineers ────────────────────────────────────────────────────────
    const engineers = await db.user.findMany({
      where: { role: "engineer" },
      select: {
        id: true, name: true, email: true,
        engineeredProjects: { select: { id: true } },
        productEvents: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const engineerRows: EngineerRow[] = engineers.map(e => ({
      id: e.id,
      name: e.name || e.email,
      email: e.email,
      projectsCount: e.engineeredProjects.length,
      lastActiveAt: e.productEvents[0]?.createdAt?.toISOString() ?? null,
    }));
    const activatedEngineers = engineerRows.filter(e => e.projectsCount > 0).length;

    // ─── Pilot funnel ─────────────────────────────────────────────────────
    const pilots = await db.pilot.groupBy({ by: ["status"], _count: true });
    const byStatus: Record<string, number> = {};
    for (const p of pilots) byStatus[p.status] = p._count;
    const pilotsTotal = pilots.reduce((s, p) => s + p._count, 0);
    const pilotsActive = ACTIVE_PILOT.reduce((s, k) => s + (byStatus[k] ?? 0), 0);
    const pilotsDone = DONE_PILOT.reduce((s, k) => s + (byStatus[k] ?? 0), 0);
    const pilotsValidated = byStatus["validated"] ?? 0;

    // ─── Verified milestones ──────────────────────────────────────────────
    const [
      prTotal, prPaid, prPaidAgg,
      obsTotal, obsVerified,
      evidenceTotal, evidenceVerified,
    ] = await Promise.all([
      db.paymentRequest.count(),
      db.paymentRequest.count({ where: { status: "paid" } }),
      db.paymentRequest.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
      db.progressObservation.count(),
      db.progressObservation.count({ where: { verified: true } }),
      db.projectEvidence.count(),
      db.projectEvidence.count({ where: { verificationStatus: "independently_verified" } }),
    ]);

    // ─── Estimated-vs-actual cost pairs (per project) ─────────────────────
    // Definition: a project has a VALID pair when it has ≥1 quotation with a
    // total amount AND ≥1 actual cost event (payment / material / labour).
    const quoteRows = await db.quotation.findMany({
      where: { totalAmount: { not: null } },
      select: { projectId: true, totalAmount: true },
    });
    const actualRows = await db.budgetEvent.findMany({
      where: { type: { in: ["payment", "material_cost", "labour_cost"] } },
      select: { projectId: true, amount: true },
    });

    const estByProject = new Map<string, { est: number; count: number }>();
    for (const r of quoteRows) {
      if (r.totalAmount == null) continue;
      const cur = estByProject.get(r.projectId) ?? { est: 0, count: 0 };
      cur.est += r.totalAmount;
      cur.count += 1;
      estByProject.set(r.projectId, cur);
    }
    const actByProject = new Map<string, { act: number; count: number }>();
    for (const r of actualRows) {
      const cur = actByProject.get(r.projectId) ?? { act: 0, count: 0 };
      cur.act += r.amount;
      cur.count += 1;
      actByProject.set(r.projectId, cur);
    }

    const projectIds = Array.from(estByProject.keys()).filter(id => actByProject.has(id));
    let projects: Array<{ id: string; name: string; city: string | null }> = [];
    if (projectIds.length) {
      projects = await db.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, city: true },
      });
    }
    const projectById = new Map(projects.map(p => [p.id, p]));

    const costPairRows: CostPair[] = [];
    for (const [projectId, est] of estByProject) {
      const act = actByProject.get(projectId);
      if (!act || est.est <= 0) continue;
      const p = projectById.get(projectId);
      costPairRows.push({
        projectId,
        projectName: p?.name ?? projectId,
        city: p?.city ?? null,
        estimatedInr: est.est,
        actualInr: act.act,
        variancePct: Math.round(((act.act - est.est) / est.est) * 1000) / 10,
        quotationCount: est.count,
        actualEventCount: act.count,
      });
    }
    costPairRows.sort((x, y) => y.estimatedInr - x.estimatedInr);
    const meanAbsVariance = costPairRows.length
      ? Math.round((costPairRows.reduce((s, r) => s + Math.abs(r.variancePct), 0) / costPairRows.length) * 10) / 10
      : null;

    // ─── Weekly active usage (last 8 ISO weeks) ───────────────────────────
    const events = await db.productEvent.findMany({
      select: { userId: true, createdAt: true },
      where: { createdAt: { gte: new Date(Date.now() - 8 * 7 * 24 * 3600 * 1000) } },
    });
    const weekMap = new Map<string, Set<string>>();
    const weekEvents = new Map<string, number>();
    for (const ev of events) {
      const wk = isoWeekStart(ev.createdAt);
      if (!weekMap.has(wk)) weekMap.set(wk, new Set());
      weekMap.get(wk)!.add(ev.userId);
      weekEvents.set(wk, (weekEvents.get(wk) ?? 0) + 1);
    }
    const weeks: WeekBucket[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i * 7);
      const wk = isoWeekStart(d);
      weeks.push({
        weekStart: wk,
        activeUsers: weekMap.get(wk)?.size ?? 0,
        events: weekEvents.get(wk) ?? 0,
      });
    }
    const wau = weekMap.get(thisWeek)?.size ?? 0;
    const wauPrev = weekMap.get(prevWeek)?.size ?? 0;

    const data: TractionData = {
      engineers: { onboarded: engineerRows.length, activated: activatedEngineers, rows: engineerRows },
      pilots: { total: pilotsTotal, byStatus, active: pilotsActive, completed: pilotsDone, validated: pilotsValidated },
      milestones: {
        paymentRequests: prTotal,
        paymentRequestsPaid: prPaid,
        paymentAmountPaidInr: prPaidAgg._sum.amount ?? 0,
        verifiedObservations: obsVerified,
        totalObservations: obsTotal,
        evidenceItems: evidenceTotal,
        independentlyVerifiedEvidence: evidenceVerified,
      },
      costPairs: {
        count: costPairRows.length,
        meanAbsVariancePct: meanAbsVariance,
        totalEstimatedInr: costPairRows.reduce((s, r) => s + r.estimatedInr, 0),
        totalActualInr: costPairRows.reduce((s, r) => s + r.actualInr, 0),
        rows: costPairRows,
      },
      usage: { wau, wauPrev, totalEvents: await db.productEvent.count(), weeks },
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/traction failed:", err);
    return NextResponse.json({ error: "Failed to compute traction metrics" }, { status: 500 });
  }
}
