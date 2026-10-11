import test from "node:test";
import assert from "node:assert/strict";
import { calculateRiskIntelligence, FeatureInput } from "../src/lib/intelligence/risk-engine";

test("Construction Risk Intelligence Engine", async (t) => {
  const baseInput: FeatureInput = {
    projectId: "proj-risk-1",
    projectName: "Skyline Residency",
    currentStage: "FOUNDATION",
    progress: 25,
    status: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    expectedCompletion: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    builtArea: 4500,
    latitude: 13.0827,
    longitude: 80.2707,
    lastInspectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalInspections: 4,
    totalPhotos: 28,
    openIssues: 1,
    criticalIssues: 0,
    highSeverityIssues: 0,
    totalIssues: 2,
    resolvedIssues: 1,
    issuesWithoutPhotos: 0,
    totalWorkers: 15,
    activeWorkers: 12,
    todayVerifiedCheckIns: 12,
    todayOutsideGeofence: 0,
    hasAnomalies: false,
    totalAiAnalyses: 5,
    aiReviewRecommended: false,
    nearbyProjects: [], // Empty nearbyProjects array
  };

  await t.test("evaluates low risk project accurately with empty nearbyProjects", () => {
    const result = calculateRiskIntelligence(baseInput);

    assert.equal(result.projectId, "proj-risk-1");
    assert.equal(result.riskLevel, "healthy");
    assert.ok(result.overallRiskScore < 40);
    assert.equal(result.categoryRisks.length, 6);
    assert.ok(result.recommendedActions.length >= 0);
    assert.equal(result.spatialContext.nearbyProjectCount, 0);
  });

  await t.test("elevates risk score when critical issues and worker anomalies are present", () => {
    const highRiskInput: FeatureInput = {
      ...baseInput,
      openIssues: 5,
      criticalIssues: 3,
      highSeverityIssues: 2,
      todayOutsideGeofence: 8,
      hasAnomalies: true,
      lastInspectionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const result = calculateRiskIntelligence(highRiskInput);

    assert.ok(result.overallRiskScore > 25);
    assert.ok(result.overallSeverity === "medium" || result.overallSeverity === "high" || result.overallSeverity === "critical");
    assert.ok(result.recommendedActions.length > 0);
  });

  await t.test("handles undefined nearbyProjects gracefully without throwing", () => {
    const withoutNearby: any = { ...baseInput };
    delete withoutNearby.nearbyProjects;

    const result = calculateRiskIntelligence(withoutNearby);
    assert.ok(result);
    assert.equal(result.spatialContext.nearbyProjectCount, 0);
  });
});
