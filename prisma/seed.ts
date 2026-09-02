import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Demo Accounts ───────────────────────────────────────────────────────────
const DEMO_ENGINEER_EMAIL = "engineer@buildme.demo";
const DEMO_ENGINEER_PASSWORD = "demo1234";
const DEMO_ENGINEER_NAME = "Demo Engineer";

// ─── Demo Projects ───────────────────────────────────────────────────────────
const DEMO_PROJECTS = [
  {
    name: "Kumar Residence",
    address: "12, EVR Periyar Salai",
    city: "Trichy",
    district: "Tiruchirappalli",
    state: "Tamil Nadu",
    pincode: "620001",
    latitude: 10.7905,
    longitude: 78.7047,
    constructionType: "house",
    builtArea: 2200,
    currentStage: "roofing",
    progress: 60,
    homeownerName: "R. Kumar",
    estimatedCost: 4500000,
    daysAgoCreated: 90,
    daysAgoUpdated: 5,
    inspectionDaysAgo: 35,
    inspectionStage: "structure",
    inspectionNotes: "Structure completed. Roofing materials delivered. Ready for roof slab casting.",
    status: "review" as const,
    alertCount: 3,
  },
  {
    name: "Priya Villa",
    address: "45, Anna Salai",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600002",
    latitude: 13.0827,
    longitude: 80.2707,
    constructionType: "villa",
    builtArea: 3500,
    currentStage: "finishing",
    progress: 88,
    homeownerName: "S. Priya",
    estimatedCost: 8500000,
    daysAgoCreated: 150,
    daysAgoUpdated: 2,
    inspectionDaysAgo: 3,
    inspectionStage: "finishing",
    inspectionNotes: "Interior painting in progress. Electrical fittings 80% complete.",
    status: "normal" as const,
    alertCount: 0,
  },
  {
    name: "Ravi Tower",
    address: "78, Gandhiji Road",
    city: "Madurai",
    district: "Madurai",
    state: "Tamil Nadu",
    pincode: "625001",
    latitude: 9.9252,
    longitude: 78.1198,
    constructionType: "apartment",
    builtArea: 1800,
    currentStage: "structure",
    progress: 35,
    homeownerName: "M. Ravi",
    estimatedCost: 6200000,
    daysAgoCreated: 60,
    daysAgoUpdated: 10,
    inspectionDaysAgo: 45,
    inspectionStage: "foundation",
    inspectionNotes: "Foundation and plinth completed. Column reinforcement started.",
    status: "attention" as const,
    alertCount: 2,
  },
  {
    name: "Lakshmi Renovation",
    address: "23, Cross Road",
    city: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
    latitude: 11.0168,
    longitude: 76.9558,
    constructionType: "renovation",
    builtArea: 1500,
    currentStage: "electrical_plumbing",
    progress: 72,
    homeownerName: "K. Lakshmi",
    estimatedCost: 2800000,
    daysAgoCreated: 45,
    daysAgoUpdated: 1,
    inspectionDaysAgo: 7,
    inspectionStage: "brickwork",
    inspectionNotes: "Brickwork completed. New electrical wiring in progress.",
    status: "normal" as const,
    alertCount: 0,
  },
  {
    name: "Saravanan Homes",
    address: "9, GTN Nagar",
    city: "Salem",
    district: "Salem",
    state: "Tamil Nadu",
    pincode: "636001",
    latitude: 11.6643,
    longitude: 78.146,
    constructionType: "house",
    builtArea: 2800,
    currentStage: "brickwork",
    progress: 48,
    homeownerName: "V. Saravanan",
    estimatedCost: 5200000,
    daysAgoCreated: 75,
    daysAgoUpdated: 12,
    inspectionDaysAgo: 28,
    inspectionStage: "structure",
    inspectionNotes: "First floor structure completed. Staircase reinforcement done.",
    status: "normal" as const,
    alertCount: 0,
  },
];

async function main() {
  console.log("🌱 Seeding BuildMe database...\n");

  // 1. Create demo engineer user
  const passwordHash = await bcrypt.hash(DEMO_ENGINEER_PASSWORD, 12);
  let engineer = await prisma.user.findUnique({
    where: { email: DEMO_ENGINEER_EMAIL },
  });

  if (!engineer) {
    engineer = await prisma.user.create({
      data: {
        name: DEMO_ENGINEER_NAME,
        email: DEMO_ENGINEER_EMAIL,
        passwordHash,
        role: "engineer",
      },
    });
    console.log(`✅ Created engineer: ${engineer.name} (${engineer.email})`);
  } else {
    console.log(`ℹ️  Engineer already exists: ${engineer.email}`);
  }

  // Check if projects already exist for this engineer
  const existingProjects = await prisma.project.count({
    where: { engineerId: engineer.id },
  });
  if (existingProjects > 0) {
    console.log(`ℹ️  ${existingProjects} projects already exist. Skipping seed.`);
    console.log(`\n🔑 Login credentials:`);
    console.log(`   Email: ${DEMO_ENGINEER_EMAIL}`);
    console.log(`   Password: ${DEMO_ENGINEER_PASSWORD}`);
    return;
  }

  const now = new Date();

  for (const demo of DEMO_PROJECTS) {
    // Create homeowner
    const homeownerEmail = `${demo.homeownerName.toLowerCase().replace(/[^a-z]/g, "")}@buildme.demo`;
    let homeowner = await prisma.user.findUnique({
      where: { email: homeownerEmail },
    });
    if (!homeowner) {
      homeowner = await prisma.user.create({
        data: {
          name: demo.homeownerName,
          email: homeownerEmail,
          passwordHash: passwordHash, // same hash as engineer — homeowners can login with "demo1234"
          role: "homeowner",
        },
      });
    }

    const createdAt = new Date(now.getTime() - demo.daysAgoCreated * 86400000);
    const updatedAt = new Date(now.getTime() - demo.daysAgoUpdated * 86400000);

    const project = await prisma.project.create({
      data: {
        name: demo.name,
        address: demo.address,
        city: demo.city,
        district: demo.district,
        state: demo.state,
        pincode: demo.pincode,
        latitude: demo.latitude,
        longitude: demo.longitude,
        formattedAddress: `${demo.address}, ${demo.city}, ${demo.district}, ${demo.state} - ${demo.pincode}`,
        constructionType: demo.constructionType,
        builtArea: demo.builtArea,
        engineerId: engineer.id,
        homeownerId: homeowner.id,
        homeownerName: demo.homeownerName,
        currentStage: demo.currentStage,
        status: demo.status,
        progress: demo.progress,
        estimatedCost: demo.estimatedCost,
        createdAt,
        updatedAt,
      },
    });

    // Create inspection
    const inspectionDate = new Date(now.getTime() - demo.inspectionDaysAgo * 86400000);
    await prisma.inspection.create({
      data: {
        projectId: project.id,
        engineerId: engineer.id,
        inspectionDate,
        stage: demo.inspectionStage,
        notes: demo.inspectionNotes,
      },
    });

    // Create alerts
    const alertTitles = [
      "Inspection overdue",
      "Material delivery delayed",
      "Documentation pending",
    ];
    for (let i = 0; i < demo.alertCount; i++) {
      await prisma.alert.create({
        data: {
          projectId: project.id,
          severity: i === 0 ? "critical" : i === 1 ? "warning" : "info",
          title: alertTitles[i % alertTitles.length],
          description: `Demo alert for ${demo.name}`,
          resolved: false,
        },
      });
    }

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        type: "milestone",
        title: "Project Created",
        description: `${demo.name} construction project initiated`,
        createdAt,
      },
    });

    // Create inspection timeline event
    await prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        type: "inspection",
        title: "Site Inspection Completed",
        description: `${demo.inspectionNotes}`,
        createdAt: inspectionDate,
      },
    });

    console.log(`✅ Created project: ${demo.name} (${demo.city}) — ${demo.status}`);
  }

  // ─── Create Demo Issues & Evidence ──────────────────────────────────────
  const projects = await prisma.project.findMany({ where: { engineerId: engineer.id } });

  // Issue 1: Inspection-related (Kumar Residence)
  const kumarProject = projects.find(p => p.name === "Kumar Residence");
  if (kumarProject) {
    const issue1 = await prisma.issue.create({
      data: {
        projectId: kumarProject.id,
        reportedById: engineer.id,
        title: "Inspection overdue — roofing materials not yet delivered",
        description: "Roofing inspection was scheduled for last week but materials have not arrived. Need to follow up with supplier.",
        category: "delay",
        severity: "high",
        status: "under_review",
      },
    });
    await prisma.issueTimelineEvent.create({
      data: { issueId: issue1.id, action: "created", description: "Issue reported", performedById: engineer.id },
    });
    await prisma.issueTimelineEvent.create({
      data: { issueId: issue1.id, action: "status_changed", description: "Status changed to Under Review", performedById: engineer.id, previousStatus: "open", newStatus: "under_review" },
    });
  }

  // Issue 2: Material quality (Ravi Tower)
  const raviProject = projects.find(p => p.name === "Ravi Tower");
  if (raviProject) {
    const issue2 = await prisma.issue.create({
      data: {
        projectId: raviProject.id,
        reportedById: engineer.id,
        title: "Brick quality below specification",
        description: "Bricks delivered to site appear to be lower grade than specified in the quotation. Need engineer verification before proceeding with brickwork.",
        category: "material",
        severity: "medium",
        status: "open",
      },
    });
    await prisma.issueTimelineEvent.create({
      data: { issueId: issue2.id, action: "created", description: "Issue reported by engineer during site visit", performedById: engineer.id },
    });
  }

  // Issue 3: Progress-related (Lakshmi Renovation) — resolved
  const lakshmiProject = projects.find(p => p.name === "Lakshmi Renovation");
  if (lakshmiProject) {
    const issue3 = await prisma.issue.create({
      data: {
        projectId: lakshmiProject.id,
        reportedById: engineer.id,
        title: "Electrical wiring delay — contractor availability",
        description: "Electrical contractor was unavailable for 3 days. New schedule confirmed for next week.",
        category: "delay",
        severity: "low",
        status: "resolved",
        resolvedAt: new Date(now.getTime() - 2 * 86400000),
      },
    });
    await prisma.issueTimelineEvent.create({
      data: { issueId: issue3.id, action: "created", description: "Issue reported", performedById: engineer.id },
    });
    await prisma.issueTimelineEvent.create({
      data: { issueId: issue3.id, action: "resolved", description: "Contractor rescheduled. Issue resolved.", performedById: engineer.id, previousStatus: "open", newStatus: "resolved" },
    });
  }

  console.log(`✅ Created ${3} demo issues with timeline events`);

  // ─── Create Demo Workers & Check-Ins ────────────────────────────────────
  const DEMO_WORKERS: Record<string, { name: string; type: string; phone: string | null; checkInOffsetMetres: number; status: string }[]> = {
    "Kumar Residence": [
      { name: "Ramesh", type: "mason", phone: "+91-9876543201", checkInOffsetMetres: 43, status: "verified" },
      { name: "Suresh", type: "mason", phone: "+91-9876543202", checkInOffsetMetres: 28, status: "verified" },
      { name: "Mani", type: "electrician", phone: "+91-9876543203", checkInOffsetMetres: 3200, status: "outside_geofence" },
      { name: "Arun", type: "helper", phone: null, checkInOffsetMetres: 67, status: "verified" },
      { name: "Karthik", type: "plumber", phone: "+91-9876543205", checkInOffsetMetres: 85, status: "verified" },
    ],
    "Ravi Tower": [
      { name: "Ganesh", type: "mason", phone: "+91-9876543210", checkInOffsetMetres: 55, status: "verified" },
      { name: "Murugan", type: "mason", phone: "+91-9876543211", checkInOffsetMetres: 38, status: "verified" },
      { name: "Vijay", type: "carpenter", phone: "+91-9876543212", checkInOffsetMetres: 120, status: "outside_geofence" },
    ],
    "Lakshmi Renovation": [
      { name: "Senthil", type: "electrician", phone: "+91-9876543220", checkInOffsetMetres: 12, status: "verified" },
      { name: "Bala", type: "plumber", phone: "+91-9876543221", checkInOffsetMetres: 45, status: "verified" },
    ],
  };

  let workerCount = 0;
  let checkInCount = 0;
  for (const project of projects) {
    const workers = DEMO_WORKERS[project.name];
    if (!workers || project.latitude === null || project.longitude === null) continue;

    for (const w of workers) {
      // Small random offset to simulate different worker locations
      const offsetLat = (w.checkInOffsetMetres / 111000) * (w.status === "outside_geofence" ? 0.029 : (Math.random() - 0.5) * 0.001);
      const offsetLon = (w.checkInOffsetMetres / 111000) * (w.status === "outside_geofence" ? 0.029 : (Math.random() - 0.5) * 0.001);

      const worker = await prisma.worker.create({
        data: {
          projectId: project.id,
          name: w.name,
          phone: w.phone,
          workerType: w.type,
          active: true,
          assignedById: engineer.id,
        },
      });
      workerCount++;

      // Create today's check-in with realistic distance
      await prisma.workerCheckIn.create({
        data: {
          workerId: worker.id,
          projectId: project.id,
          latitude: project.latitude + offsetLat,
          longitude: project.longitude + offsetLon,
          accuracy: w.status === "verified" ? 8 + Math.random() * 15 : 25 + Math.random() * 20,
          siteLatitude: project.latitude,
          siteLongitude: project.longitude,
          distanceFromSite: w.checkInOffsetMetres,
          geofenceRadius: 100,
          verificationStatus: w.status,
          checkedInById: engineer.id,
          checkInTime: new Date(now.getTime() - (3 + Math.random() * 5) * 3600000), // 3-8 hours ago
        },
      });
      checkInCount++;
    }
  }
  console.log(`✅ Created ${workerCount} workers + ${checkInCount} check-ins`);

  // ─── Create Demo Budget Events (Project Truth Layer) ───────────────────
  let budgetEventCount = 0;
  let changeRequestCount = 0;
  let siteContextCount = 0;

  // Kumar Residence — has a budget story with changes
  const kumarBudget = projects.find(p => p.name === "Kumar Residence");
  if (kumarBudget) {
    const dA = (d: number) => new Date(now.getTime() - d * 86400000);

    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "other", title: "Original project estimate", description: "Quoted ₹45L for residential construction. Flooring, electrical, plumbing quoted separately.", amount: 0, cumulativeTotal: 4500000, confidence: "high", source: "quotation", createdAt: dA(90) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "payment", title: "Mobilization advance — 15%", description: "₹6,75,000 advance paid by R. Kumar via bank transfer.", amount: 675000, cumulativeTotal: 4500000, confidence: "high", source: "payment", createdAt: dA(88) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "escalation", category: "structure", title: "TMT bar price increase", description: "TMT bar rates increased from ₹52/kg to ₹56/kg. Impact on structure cost.", amount: 85000, cumulativeTotal: 4585000, confidence: "high", source: "engineer", createdAt: dA(60) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "change_impact", category: "other", title: "Additional bathroom requested", description: "Homeowner requested additional bathroom on first floor.", amount: 145000, cumulativeTotal: 4730000, confidence: "medium", source: "engineer", createdAt: dA(40) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "site_condition", title: "Additional excavation for water table", description: "Water table higher than expected. Required additional 2 feet of excavation.", amount: 72000, cumulativeTotal: 4802000, confidence: "medium", source: "engineer", createdAt: dA(70) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, type: "payment", title: "Foundation stage payment — 20%", description: "₹9,00,000 paid by R. Kumar after foundation completion.", amount: 900000, cumulativeTotal: 4802000, confidence: "high", source: "payment", createdAt: dA(50) } });
    budgetEventCount++;
    await prisma.changeRequest.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, title: "Additional bathroom — first floor", description: "Homeowner requested additional bathroom. Requires plumbing rerouting, structural modification.", category: "addition", status: "approved", estimatedCostLow: 120000, estimatedCostHigh: 170000, timelineImpactDays: 7, rationale: "Family requires additional bathroom for guests.", approvedById: engineer.id, approvedAt: dA(38), createdAt: dA(40) } });
    changeRequestCount++;
    await prisma.changeRequest.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, title: "Kitchen tile upgrade", description: "Premium kitchen tiles at ₹85/sq.ft instead of standard ₹55/sq.ft.", category: "material_upgrade", status: "completed", estimatedCostLow: 18000, estimatedCostHigh: 22000, actualCost: 20000, timelineImpactDays: 0, rationale: "Homeowner preferred premium finish.", completedAt: dA(15), createdAt: dA(30) } });
    changeRequestCount++;
    await prisma.siteContext.create({ data: { projectId: kumarBudget.id, createdById: engineer.id, roadAccess: "narrow", vehicleAccess: "limited", waterAvailability: "borewell", siteLevel: "below_road", soilType: "mixed", waterTableDepth: "shallow", accessDistanceM: 80, basementRequired: true, costRiskNotes: "Narrow road — heavy vehicle deliveries require coordination. Shallow water table requires additional waterproofing.", createdAt: dA(85) } });
    siteContextCount++;
  }

  // Ravi Tower — has a change request
  const raviBudget = projects.find(p => p.name === "Ravi Tower");
  if (raviBudget) {
    const dA = (d: number) => new Date(now.getTime() - d * 86400000);
    await prisma.budgetEvent.create({ data: { projectId: raviBudget.id, createdById: engineer.id, type: "other", title: "Original project estimate", description: "₹62L for apartment at ₹1,800/sq.ft.", amount: 0, cumulativeTotal: 6200000, confidence: "high", source: "quotation", createdAt: dA(60) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: raviBudget.id, createdById: engineer.id, type: "site_condition", title: "Rocky soil — additional excavation cost", description: "Rocky soil required jackhammer for foundation excavation.", amount: 95000, cumulativeTotal: 6295000, confidence: "high", source: "engineer", createdAt: dA(45) } });
    budgetEventCount++;
    await prisma.siteContext.create({ data: { projectId: raviBudget.id, createdById: engineer.id, roadAccess: "wide", vehicleAccess: "full", waterAvailability: "municipal", siteLevel: "at_road", soilType: "rocky", waterTableDepth: "deep", basementRequired: false, costRiskNotes: "Rocky soil increases foundation costs. Good road access.", createdAt: dA(55) } });
    siteContextCount++;
    await prisma.changeRequest.create({ data: { projectId: raviBudget.id, createdById: engineer.id, title: "Foundation depth increase", description: "Foundation depth increased from 4ft to 6ft due to rocky soil.", category: "site_requirement", status: "completed", estimatedCostLow: 80000, estimatedCostHigh: 110000, actualCost: 95000, timelineImpactDays: 5, rationale: "Site soil condition required deeper foundation.", completedAt: dA(42), createdAt: dA(48) } });
    changeRequestCount++;
  }

  // Lakshmi Renovation — simple budget
  const lakshmiBudget = projects.find(p => p.name === "Lakshmi Renovation");
  if (lakshmiBudget) {
    const dA = (d: number) => new Date(now.getTime() - d * 86400000);
    await prisma.budgetEvent.create({ data: { projectId: lakshmiBudget.id, createdById: engineer.id, type: "other", title: "Original renovation estimate", description: "₹28L for complete renovation.", amount: 0, cumulativeTotal: 2800000, confidence: "high", source: "quotation", createdAt: dA(45) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: lakshmiBudget.id, createdById: engineer.id, type: "payment", title: "Advance payment — 30%", description: "₹8,40,000 advance paid by K. Lakshmi.", amount: 840000, cumulativeTotal: 2800000, confidence: "high", source: "payment", createdAt: dA(42) } });
    budgetEventCount++;
  }

  // Priya Villa — clean budget
  const priyaBudget = projects.find(p => p.name === "Priya Villa");
  if (priyaBudget) {
    const dA = (d: number) => new Date(now.getTime() - d * 86400000);
    await prisma.budgetEvent.create({ data: { projectId: priyaBudget.id, createdById: engineer.id, type: "other", title: "Original villa estimate", description: "₹85L for premium villa.", amount: 0, cumulativeTotal: 8500000, confidence: "high", source: "quotation", createdAt: dA(150) } });
    budgetEventCount++;
    await prisma.budgetEvent.create({ data: { projectId: priyaBudget.id, createdById: engineer.id, type: "payment", title: "Mobilization advance", description: "₹12,75,000 paid by S. Priya.", amount: 1275000, cumulativeTotal: 8500000, confidence: "high", source: "payment", createdAt: dA(148) } });
    budgetEventCount++;
  }

  console.log(`✅ Created ${budgetEventCount} budget events + ${changeRequestCount} change requests + ${siteContextCount} site contexts`);

  // ─── DEMO QUOTATIONS ──────────────────────────────────────────────────
  console.log(`\n📋 Creating demo quotations...`);
  let quotationCount = 0;

  // Kumar Residence — Structure-only quotation
  const kumarQuotProject = projects.find(p => p.name === "Kumar Residence");
  if (kumarQuotProject) {
    const q1 = await prisma.quotation.create({
      data: {
        projectId: kumarQuotProject.id,
        createdById: engineer.id,
        title: "Hemanth Kumar R — Structure Estimate",
        sourceType: "manual",
        builtArea: 2200,
        floors: 2,
        projectType: "residential",
        totalAmount: 3190000,
        ratePerSqFt: 1450,
        rateType: "per_sqft",
        qualityLevel: "standard",
        materialBrands: "Superior quality blocks, Filtered M-Sand, P-Sand",
        paymentTerms: "15% mobilization advance. Water/electricity by owner.",
        escalationClause: "Rates revised if work stopped >3 months",
        validity: "Not specified",
        includesStructure: true,
        includesFoundation: true,
        includesMasonry: true,
        includesPlastering: true,
        includesWaterproofing: true,
        includesFlooring: false,
        includesPainting: false,
        includesDoors: false,
        includesElectrical: false,
        includesPlumbing: false,
        includesKitchen: false,
        includesBathroom: false,
        includesFittings: false,
        scopeCompleteness: 36,
        missingInfo: JSON.stringify(["Validity not specified", "Material brands not fully specified", "No escalation clause details", "Flooring excluded", "Electrical excluded", "Plumbing excluded"]),
        exclusions: JSON.stringify(["Flooring", "Electrical", "Plumbing", "Painting", "Doors/Windows", "Kitchen", "Bathroom fittings"]),
        assumptions: JSON.stringify(["Standard soil conditions", "Road access available", "Water available at site"]),
        comparisonWarning: "This quotation covers structure only. Cannot be directly compared with full-scope quotations.",
      },
    });
    quotationCount++;

    // Quotation B — Full scope
    const q2 = await prisma.quotation.create({
      data: {
        projectId: kumarQuotProject.id,
        createdById: engineer.id,
        title: "Harish Builders — Full Package",
        sourceType: "manual",
        builtArea: 2200,
        projectType: "residential",
        totalAmount: 5060000,
        ratePerSqFt: 2300,
        rateType: "package",
        qualityLevel: "standard",
        materialBrands: "Ramco/JSW cement, Fe 550 TMT (Indrola/JSW), M-Sand",
        paymentTerms: "Stage-wise payment",
        escalationClause: "Not specified",
        validity: "Not specified",
        includesStructure: true,
        includesFoundation: true,
        includesMasonry: true,
        includesPlastering: true,
        includesWaterproofing: true,
        includesFlooring: true,
        includesPainting: true,
        includesDoors: true,
        includesElectrical: true,
        includesPlumbing: true,
        includesKitchen: true,
        includesBathroom: true,
        includesFittings: true,
        scopeCompleteness: 100,
        missingInfo: null,
        exclusions: JSON.stringify(["Plumbing fixtures ( premium brand)", "False ceiling"]),
        assumptions: JSON.stringify(["Standard specifications", "No site-specific adjustments"]),
        comparisonWarning: null,
      },
    });
    quotationCount++;
  }

  // Lakshmi Renovation — BOQ-style
  const lakshmiQuotProject = projects.find(p => p.name === "Lakshmi Renovation");
  if (lakshmiQuotProject) {
    const q3 = await prisma.quotation.create({
      data: {
        projectId: lakshmiQuotProject.id,
        createdById: engineer.id,
        title: "UV Design — BOQ Estimate",
        sourceType: "manual",
        builtArea: 1800,
        projectType: "renovation",
        totalAmount: 12804349,
        ratePerSqFt: 2113,
        rateType: "boq",
        qualityLevel: "premium",
        materialBrands: "Not specified",
        paymentTerms: "As per BOQ stages",
        escalationClause: "Not specified",
        validity: "Not specified",
        includesStructure: true,
        includesFoundation: true,
        includesMasonry: true,
        includesPlastering: true,
        includesFlooring: true,
        includesWaterproofing: true,
        includesPainting: true,
        includesDoors: true,
        includesElectrical: false,
        includesPlumbing: false,
        includesKitchen: true,
        includesBathroom: true,
        includesFittings: false,
        scopeCompleteness: 79,
        missingInfo: JSON.stringify(["Electrical scope unclear", "Plumbing scope unclear", "Fittings not specified"]),
        exclusions: JSON.stringify(["Electrical work", "Plumbing fixtures"]),
        assumptions: JSON.stringify(["Existing structure in good condition", "Normal access"]),
        comparisonWarning: "This is a renovation estimate. Scope differs from new construction.",
      },
    });
    quotationCount++;
  }

  console.log(`✅ Created ${quotationCount} demo quotations`);

  console.log(`\n🎉 Seeding complete: ${DEMO_PROJECTS.length} projects + 3 issues + ${workerCount} workers + ${budgetEventCount} budget events + ${changeRequestCount} change requests + ${quotationCount} quotations`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Email: ${DEMO_ENGINEER_EMAIL}`);
  console.log(`   Password: ${DEMO_ENGINEER_PASSWORD}`);
  console.log(`\n📊 All data is DEMO DATA for demonstration purposes.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
