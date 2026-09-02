import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAiConfig } from "@/lib/ai/provider";
import { calculateConditionScore } from "@/lib/property/condition-score";

/**
 * POST /api/properties/[id]/analyze
 * Run AI visual property analysis on uploaded photos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    // Verify property ownership
    const property = await db.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if AI is configured
    const aiConfig = getAiConfig();
    if (!aiConfig) {
      return NextResponse.json(
        { error: "NO_AI_CONFIGURED", message: "AI analysis is not configured. Please set the AI_API_KEY environment variable." },
        { status: 503 }
      );
    }

    // Get property photos
    const photos = await db.propertyPhoto.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "asc" },
      take: aiConfig.maxImagesPerInspection,
    });

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos to analyze. Please upload photos first." }, { status: 400 });
    }

    // Build system prompt for property condition analysis
    const systemPrompt = `You are a property condition analysis assistant. You examine photographs of a property and identify visible issues that may deserve professional inspection.

## YOUR TASK
Analyze the provided property images and identify visible conditions or concerns.

## IMPORTANT RULES
1. Focus ONLY on observable evidence in the photographs.
2. Do NOT claim structural safety, engineering compliance, or certify the property.
3. Do NOT say: "The property is safe", "No defects found", "The structure is sound".
4. Instead use language like: "A possible observation is visible", "This area may benefit from professional inspection", "No clear concern was identified in this view".
5. Consider the property context (age, type) when interpreting observations.
6. When image quality prevents reliable assessment, state this.
7. Always recommend professional verification for significant findings.

## OUTPUT FORMAT
Respond with valid JSON matching this schema:

{
  "overall_condition": "good" | "moderate" | "poor",
  "confidence": 0.0 to 1.0,
  "summary": "string - brief overall summary",
  "issues": [
    {
      "issue_type": "crack" | "dampness" | "stain" | "peeling_paint" | "corrosion" | "damage" | "uneven_surface",
      "description": "string describing what is observed",
      "confidence": 0.0 to 1.0,
      "severity": "low" | "medium" | "high",
      "recommendation": "string - what the buyer should consider doing",
      "photo_category": "string matching one of the uploaded photo categories"
    }
  ],
  "positive_observations": ["string describing good conditions observed"],
  "areas_needing_professional_inspection": ["string describing areas that need a professional"]
}

Respond ONLY with the JSON object.`;

    // Build user message
    const categories = [...new Set(photos.map(p => p.category || "unknown"))];
    const userMessage = `## PROPERTY CONTEXT
- Property Name: ${property.name}
- Type: ${property.propertyType || "Unknown"}
- Age: ${property.propertyAge ? `${property.propertyAge} years` : "Not specified"}
- Built Area: ${property.builtArea ? `${property.builtArea} sq ft` : "Not specified"}
- Floors: ${property.floors || "Not specified"}

## PHOTOS TO ANALYZE
The images are organized by category: ${categories.join(", ")}.
Analyze each visible area for possible concerns.`;

    // Build image parts
    const imageParts = photos.map(p => ({
      type: "image_url" as const,
      image_url: { url: p.fileUrl, detail: "low" as const },
    }));

    // Call AI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "text", text: userMessage }, ...imageParts] },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned empty response");
    }

    // Parse result
    const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned malformed JSON response");
    }

    // Create analysis record
    const analysis = await db.propertyAiAnalysis.create({
      data: {
        propertyId: id,
        generatedBy: userId,
        model: aiConfig.model,
        provider: aiConfig.provider,
        conditionLevel: result.overall_condition || "unknown",
        conditionScore: result.confidence || 0,
        summary: result.summary || "",
        structuredResult: JSON.stringify(result),
      },
    });

    // Create photo analysis records
    if (result.issues && Array.isArray(result.issues)) {
      for (const issue of result.issues) {
        // Find matching photo by category
        const matchingPhoto = photos.find(p => p.category === issue.photo_category);

        if (matchingPhoto) {
          await db.propertyPhotoAnalysis.create({
            data: {
              analysisId: analysis.id,
              photoId: matchingPhoto.id,
              issueType: issue.issue_type || "damage",
              description: issue.description || "",
              confidence: issue.confidence || 0.5,
              severity: issue.severity || "low",
              recommendation: issue.recommendation || null,
            },
          });
        }
      }
    }

    // Update property condition score
    const allAnalyses = await db.propertyPhotoAnalysis.findMany({
      where: { photo: { propertyId: id } },
      select: { severity: true },
    });

    const allPhotos = await db.propertyPhoto.findMany({
      where: { propertyId: id },
      select: { category: true },
    });

    const cats = [...new Set(allPhotos.map(p => p.category).filter(Boolean))] as string[];
    const highSev = allAnalyses.filter(a => a.severity === "high").length;
    const medSev = allAnalyses.filter(a => a.severity === "medium").length;
    const lowSev = allAnalyses.filter(a => a.severity === "low").length;

    const conditionResult = calculateConditionScore({
      propertyAge: property.propertyAge,
      totalPhotos: allPhotos.length,
      totalIssues: allAnalyses.length,
      highSeverityIssues: highSev,
      mediumSeverityIssues: medSev,
      lowSeverityIssues: lowSev,
      inspectionCategories: cats,
    });

    await db.property.update({
      where: { id },
      data: {
        conditionLevel: conditionResult.level,
        conditionScore: conditionResult.score,
        conditionReasons: JSON.stringify(conditionResult.reasons),
      },
    });

    // Return the analysis with photo analyses
    const fullAnalysis = await db.propertyAiAnalysis.findUnique({
      where: { id: analysis.id },
      include: {
        photoAnalyses: {
          include: {
            photo: { select: { id: true, fileUrl: true, category: true } },
          },
        },
      },
    });

    return NextResponse.json(fullAnalysis, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Property analysis error:", errorMessage);
    return NextResponse.json(
      { error: "Analysis could not be completed. Please try again.", detail: errorMessage },
      { status: 500 }
    );
  }
}
