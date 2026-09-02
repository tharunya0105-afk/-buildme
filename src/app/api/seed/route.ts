import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// ─── Demo Data: Realistic Tamil Nadu Construction Projects ──────────────────
// All data is DEMO DATA for demonstration purposes only.
// Coordinates, costs, and project details are fictional.
// Clearly labeled — do NOT represent real measurements or projects.

interface DemoProject {
  name: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  constructionType: string;
  builtArea: number;
  currentStage: string;
  progress: number;
  homeownerName: string;
  estimatedCost: number;
  daysAgoCreated: number;
  daysAgoUpdated: number;
  daysAgoInspection: number | null;
  inspectionStage: string;
  inspectionNotes: string;
  unresolvedAlerts: number;
}

const DEMO_PROJECTS: DemoProject[] = [
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
    daysAgoInspection: 35,
    inspectionStage: "structure",
    inspectionNotes: "Structure completed. Roofing materials delivered. Ready for roof slab casting.",
    unresolvedAlerts: 3,
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
    daysAgoInspection: 3,
    inspectionStage: "finishing",
    inspectionNotes: "Interior painting in progress. Electrical fittings 80% complete. Plumbing fixtures being installed.",
    unresolvedAlerts: 0,
  },
  {
    name: "Ravi Tower - Unit 3",
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
    daysAgoInspection: 45,
    inspectionStage: "foundation",
    inspectionNotes: "Foundation and plinth completed. Column reinforcement started.",
    unresolvedAlerts: 2,
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
    daysAgoInspection: 7,
    inspectionStage: "brickwork",
    inspectionNotes: "Brickwork completed. New electrical wiring in progress. Plumbing layout approved.",
    unresolvedAlerts: 1,
  },
  {
    name: "Saravanan Homes",
    address: "9, GTN Nagar",
    city: "Salem",
    district: "Salem",
    state: "Tamil Nadu",
    pincode: "636001",
    latitude: 11.6643,
    longitude: 78.1460,
    constructionType: "house",
    builtArea: 2800,
    currentStage: "brickwork",
    progress: 48,
    homeownerName: "V. Saravanan",
    estimatedCost: 5200000,
    daysAgoCreated: 75,
    daysAgoUpdated: 12,
    daysAgoInspection: 28,
    inspectionStage: "structure",
    inspectionNotes: "First floor structure completed. Staircase reinforcement done. Brickwork starting next week.",
    unresolvedAlerts: 0,
  },
  {
    name: "Anitha's Dream Home",
    address: "56, Velachery Main Road",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600042",
    latitude: 12.9815,
    longitude: 80.2180,
    constructionType: "house",
    builtArea: 2000,
    currentStage: "planning",
    progress: 5,
    homeownerName: "T. Anitha",
    estimatedCost: 4000000,
    daysAgoCreated: 10,
    daysAgoUpdated: 10,
    daysAgoInspection: null,
    inspectionStage: "planning",
    inspectionNotes: "Site survey completed. Architecture plans under review. awaiting approval.",
    unresolvedAlerts: 0,
  },
  {
    name: "Balaji Nagar Block B",
    address: "112, Mettupalayam Road",
    city: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641039",
    latitude: 11.0058,
    longitude: 76.9715,
    constructionType: "apartment",
    builtArea: 4200,
    currentStage: "foundation",
    progress: 18,
    homeownerName: "P. Balaji",
    estimatedCost: 12000000,
    daysAgoCreated: 30,
    daysAgoUpdated: 20,
    daysAgoInspection: 25,
    inspectionStage: "planning",
    inspectionNotes: "Soil testing complete. Foundation excavation started. Footing layout marked.",
    unresolvedAlerts: 1,
  },
  {
    name: "Meena Enclave - Phase 2",
    address: "8, VOC Nagar",
    city: "Tirunelveli",
    district: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627001",
    latitude: 8.7139,
    longitude: 77.7567,
    constructionType: "house",
    builtArea: 1900,
    currentStage: "completed",
    progress: 100,
    homeownerName: "G. Meena",
    estimatedCost: 3800000,
    daysAgoCreated: 200,
    daysAgoUpdated: 5,
    daysAgoInspection: 2,
    inspectionStage: "completed",
    inspectionNotes: "Final inspection completed. All works satisfactory. Handover documentation prepared.",
    unresolvedAlerts: 0,
  },
  {
    name: "Venkatesh Garden Villa",
    address: "34, Race Course Road",
    city: "Erode",
    district: "Erode",
    state: "Tamil Nadu",
    pincode: "638001",
    latitude: 11.3410,
    longitude: 77.7172,
    constructionType: "villa",
    builtArea: 3200,
    currentStage: "roofing",
    progress: 58,
    homeownerName: "D. Venkatesh",
    estimatedCost: 7500000,
    daysAgoCreated: 80,
    daysAgoUpdated: 8,
    daysAgoInspection: 15,
    inspectionStage: "brickwork",
    inspectionNotes: "Brickwork and plastering completed on both floors. Roof shuttering in progress.",
    unresolvedAlerts: 2,
  },
  {
    name: "Surya Apartment - Flat 4B",
    address: "67, East Coast Road",
    city: "Pondicherry",
    district: "Pondicherry",
    state: "Tamil Nadu",
    pincode: "605001",
    latitude: 11.9416,
    longitude: 79.8083,
    constructionType: "apartment",
    builtArea: 1600,
    currentStage: "structure",
    progress: 32,
    homeownerName: "J. Surya",
    estimatedCost: 5800000,
    daysAgoCreated: 55,
    daysAgoUpdated: 15,
    daysAgoInspection: 50,
    inspectionStage: "foundation",
    inspectionNotes: "Foundation and basement completed. Column starting. Need to follow up on steel delivery.",
    unresolvedAlerts: 4,
  },
];

const DEMO_HOMEOWNER_EMAILS = [
  "r.kumar@example.com",
  "s.priya@example.com",
  "m.ravi@example.com",
  "k.lakshmi@example.com",
  "v.saravanan@example.com",
  "t.anitha@example.com",
  "p.balaji@example.com",
  "g.meena@example.com",
  "d.venkatesh@example.com",
  "j.surya@example.com",
];

/**
 * POST /api/seed
 * Seed demo construction projects for spatial dashboard demonstration.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can seed demo data" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    // Check if demo data already exists
    const existingCount = await db.project.count({
      where: { engineerId },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        {
          error: "Projects already exist. Demo data seeding is only available for new accounts.",
          existingProjects: existingCount,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    let createdCount = 0;

    for (let i = 0; i < DEMO_PROJECTS.length; i++) {
      const demo = DEMO_PROJECTS[i];
      const email = DEMO_HOMEOWNER_EMAILS[i];

      // Create or find homeowner user
      let homeowner = await db.user.findUnique({ where: { email } });
      if (!homeowner) {
        homeowner = await db.user.create({
          data: {
            name: demo.homeownerName,
            email,
            passwordHash: await bcrypt.hash("demo1234", 12),
            role: "homeowner",
          },
        });
      }

      const createdAt = new Date(
        now.getTime() - demo.daysAgoCreated * 24 * 60 * 60 * 1000
      );
      const updatedAt = new Date(
        now.getTime() - demo.daysAgoUpdated * 24 * 60 * 60 * 1000
      );

      // Create the project
      const project = await db.project.create({
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
          engineerId,
          homeownerId: homeowner.id,
          homeownerName: demo.homeownerName,
          currentStage: demo.currentStage,
          status: demo.unresolvedAlerts >= 3 ? "review" : demo.unresolvedAlerts >= 1 ? "attention" : "normal",
          progress: demo.progress,
          estimatedCost: demo.estimatedCost,
          createdAt,
          updatedAt,
        },
      });

      // Create a demo inspection if specified
      if (demo.daysAgoInspection !== null) {
        const inspectionDate = new Date(
          now.getTime() - demo.daysAgoInspection * 24 * 60 * 60 * 1000
        );

        await db.inspection.create({
          data: {
            projectId: project.id,
            engineerId,
            inspectionDate,
            stage: demo.inspectionStage,
            notes: demo.inspectionNotes,
          },
        });
      }

      // Create demo alerts
      for (let j = 0; j < demo.unresolvedAlerts; j++) {
        const alertTitles = [
          "Material delivery delayed",
          "Inspection follow-up needed",
          "Documentation pending",
          "Contractor schedule conflict",
          "Payment approval required",
        ];
        const severities = ["info", "warning", "critical"];

        await db.alert.create({
          data: {
            projectId: project.id,
            severity: severities[j % severities.length],
            title: alertTitles[j % alertTitles.length],
            description: `Demo alert ${j + 1} for ${demo.name}`,
            resolved: false,
          },
        });
      }

      // Create a timeline event
      await db.timelineEvent.create({
        data: {
          projectId: project.id,
          type: "milestone",
          title: "Project Created",
          description: `${demo.name} project initiated`,
          createdAt,
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Demo data seeded: ${createdCount} construction projects across Tamil Nadu`,
      projects: createdCount,
      note: "All data is demo data for demonstration purposes only.",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    );
  }
}
