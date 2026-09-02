import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/commercialization
 * Returns customer discovery records, pricing experiments, value experiments, and summary stats.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const [discoveries, pricingExperiments, valueExperiments] = await Promise.all([
      db.customerDiscovery.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
      }),
      db.pricingExperiment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      db.valueExperiment.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Compute funnel counts
    const funnel = {
      discovered: discoveries.filter(d => d.status === "discovered").length,
      interviewed: discoveries.filter(d => d.status === "interviewed").length,
      interested: discoveries.filter(d => d.status === "interested").length,
      pilotCandidate: discoveries.filter(d => d.status === "pilot_candidate").length,
      pilotActive: discoveries.filter(d => d.status === "pilot_active").length,
      pilotCompleted: discoveries.filter(d => d.status === "pilot_completed").length,
      paying: discoveries.filter(d => d.status === "paying").length,
      retained: discoveries.filter(d => d.status === "retained").length,
    };

    // Pain frequency
    const painCounts: Record<string, { count: number; severity: string }> = {};
    for (const d of discoveries) {
      if (d.biggestPain) {
        const key = d.biggestPain;
        if (!painCounts[key]) painCounts[key] = { count: 0, severity: d.painSeverity || "unknown" };
        painCounts[key].count++;
      }
    }

    // Willingness to pay
    const wtpCounts: Record<string, number> = {};
    for (const d of discoveries) {
      if (d.willingnessToPay) {
        wtpCounts[d.willingnessToPay] = (wtpCounts[d.willingnessToPay] || 0) + 1;
      }
    }

    // Pricing preference
    const pricingCounts: Record<string, number> = {};
    for (const d of discoveries) {
      if (d.preferredPricingModel) {
        pricingCounts[d.preferredPricingModel] = (pricingCounts[d.preferredPricingModel] || 0) + 1;
      }
    }

    return NextResponse.json({
      discoveries,
      pricingExperiments,
      valueExperiments,
      funnel,
      painCounts,
      wtpCounts,
      pricingCounts,
      summary: {
        totalDiscoveries: discoveries.length,
        totalInterviews: discoveries.filter(d => d.interviewDate).length,
        totalPricingExperiments: pricingExperiments.length,
        totalValueExperiments: valueExperiments.length,
      },
    });
  } catch (error) {
    console.error("Commercialization API error:", error);
    return NextResponse.json({ error: "Failed to load commercialization data" }, { status: 500 });
  }
}

/**
 * POST /api/commercialization
 * Create a customer discovery record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await request.json();

    const discovery = await db.customerDiscovery.create({
      data: {
        createdById: userId,
        participantRef: body.participantRef || null,
        role: body.role || null,
        organizationType: body.organizationType || null,
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
        currentWorkflow: body.currentWorkflow || null,
        biggestPain: body.biggestPain || null,
        painSeverity: body.painSeverity || null,
        frequency: body.frequency || null,
        costOfProblem: body.costOfProblem || null,
        currentTools: body.currentTools || null,
        buildMeReaction: body.buildMeReaction || null,
        trustedIntelligence: body.trustedIntelligence ?? null,
        mostValuableFeature: body.mostValuableFeature || null,
        requestedFeature: body.requestedFeature || null,
        willingnessToPilot: body.willingnessToPilot || null,
        willingnessToPay: body.willingnessToPay || null,
        preferredPricingModel: body.preferredPricingModel || null,
        biggestObjection: body.biggestObjection || null,
        status: body.status || "discovered",
        notes: body.notes || null,
      },
    });

    // Track event
    await db.productEvent.create({
      data: { userId, eventType: "customer_discovery_created", metadata: JSON.stringify({ discoveryId: discovery.id }) },
    });

    return NextResponse.json({ success: true, discovery });
  } catch (error) {
    console.error("Customer discovery POST error:", error);
    return NextResponse.json({ error: "Failed to create discovery record" }, { status: 500 });
  }
}

/**
 * PATCH /api/commercialization
 * Update a customer discovery record's status.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.customerDiscovery.findUnique({ where: { id: body.id } });
    if (!existing || existing.createdById !== userId) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    const discovery = await db.customerDiscovery.update({
      where: { id: body.id },
      data: {
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
        biggestPain: body.biggestPain ?? existing.biggestPain,
        painSeverity: body.painSeverity ?? existing.painSeverity,
        willingnessToPilot: body.willingnessToPilot ?? existing.willingnessToPilot,
        willingnessToPay: body.willingnessToPay ?? existing.willingnessToPay,
        preferredPricingModel: body.preferredPricingModel ?? existing.preferredPricingModel,
      },
    });

    return NextResponse.json({ success: true, discovery });
  } catch (error) {
    console.error("Customer discovery PATCH error:", error);
    return NextResponse.json({ error: "Failed to update discovery record" }, { status: 500 });
  }
}
