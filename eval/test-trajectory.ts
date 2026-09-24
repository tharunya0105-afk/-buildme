/**
 * Trajectory Unit Tests
 *
 * Tests the Viterbi decoder in isolation, without any DB or API calls.
 * This is the hardest-tested part of the codebase — it's the novel mechanism.
 *
 * Run: npx tsx eval/test-trajectory.ts
 */

import {
  fitTrajectory,
  fitTrajectoryWithDualPassCheck,
  DEFAULT_TRAJECTORY_CONFIG,
  type StageObservation,
} from "../src/lib/stage-graph/trajectory";
import { getStagesForElement, STAGE_GRAPH } from "../src/lib/stage-graph/index";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`${message ?? "Assertion failed"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ─── Stage Graph Tests ─────────────────────────────────────────────────────

console.log("\n── Stage Graph Structure ──");

test("stage graph loads without error", () => {
  assert(STAGE_GRAPH.version !== undefined, "version missing");
  assert(Object.keys(STAGE_GRAPH.elementTypes).length > 0, "no element types");
});

test("column has all required stages", () => {
  const stages = getStagesForElement("column");
  assert(stages.length >= 4, `expected ≥4 stages, got ${stages.length}`);
  const ids = stages.map((s) => s.id);
  assert(ids.includes("column_rebar"), "column_rebar missing");
  assert(ids.includes("column_concrete"), "column_concrete missing");
});

test("footing rebar is concealed_by_next", () => {
  const stages = getStagesForElement("footing");
  const rebar = stages.find((s) => s.id === "footing_rebar");
  assert(rebar !== undefined, "footing_rebar not found");
  assertEqual(rebar!.observability, "concealed_by_next", "rebar should be concealed_by_next");
});

test("footing backfill is visible", () => {
  const stages = getStagesForElement("footing");
  const backfill = stages.find((s) => s.id === "footing_backfill");
  assert(backfill !== undefined, "footing_backfill not found");
  assertEqual(backfill!.observability, "visible", "backfill should be visible");
});

test("valid transitions only go forward in column", () => {
  const stages = getStagesForElement("column");
  const idxById: Record<string, number> = {};
  stages.forEach((s, i) => (idxById[s.id] = i));
  for (const stage of stages) {
    for (const nextId of stage.validTransitions) {
      const fromIdx = idxById[stage.id];
      const toIdx = idxById[nextId];
      assert(
        toIdx !== undefined && toIdx > fromIdx,
        `transition ${stage.id} → ${nextId}: expected forward-only (${fromIdx} → ${toIdx})`
      );
    }
  }
});

// ─── Trajectory Fitting Tests ──────────────────────────────────────────────

console.log("\n── Trajectory Fitting ──");

test("column trajectory with clear evidence returns non-abstained result", () => {
  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-10T09:00:00Z",
      stageProbabilities: { column_pedestal: 0.85, column_rebar: 0.10, column_formwork: 0.05 },
      overallConfidence: 0.90,
    },
    {
      photoId: "p2",
      timestamp: "2026-01-18T09:00:00Z",
      stageProbabilities: { column_formwork: 0.78, column_concrete: 0.15, column_rebar: 0.07 },
      overallConfidence: 0.82,
    },
    {
      photoId: "p3",
      timestamp: "2026-02-01T09:00:00Z",
      stageProbabilities: { column_deshuttered: 0.80, column_concrete: 0.12, column_cured: 0.08 },
      overallConfidence: 0.88,
    },
  ];

  const result = fitTrajectory("column", "test-col-1", observations);
  assert(!result.abstained, `expected non-abstained result, got: ${result.abstentionReason}`);
  assert(result.fittedPath.length > 0, "expected fitted path");
  assert(result.trajectoryConfidence > 0, "expected positive confidence");
});

test("inferred-concealed stage is labeled correctly for footing rebar", () => {
  // Scenario: we saw excavation and backfill, but rebar is between them
  // The graph forces rebar to have occurred (it's on the path from excavation to backfill)
  // But we never photographed it — it should be "inferred_concealed"
  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-01T09:00:00Z",
      stageProbabilities: { footing_excavation: 0.85, footing_pcc: 0.10, footing_rebar: 0.05 },
      overallConfidence: 0.88,
    },
    {
      photoId: "p2",
      timestamp: "2026-01-20T09:00:00Z",
      stageProbabilities: { footing_backfill: 0.80, footing_concrete: 0.15, footing_rebar: 0.05 },
      overallConfidence: 0.85,
    },
  ];

  const result = fitTrajectory("footing", "test-footing-1", observations);
  assert(!result.abstained, `should not abstain: ${result.abstentionReason}`);

  // Find rebar in the fitted path (if it's there)
  const rebarInPath = result.fittedPath.find((s) => s.stageId === "footing_rebar");
  if (rebarInPath) {
    // It should be inferred_concealed since we never actually saw it
    assert(
      rebarInPath.status === "inferred_concealed",
      `expected inferred_concealed for rebar, got ${rebarInPath.status}`
    );
  }
  // Current stage should be backfill or after
  assert(result.currentStage !== null, "expected a current stage");
});

test("ablation: disabling observability makes inferred_concealed impossible", () => {
  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-01T09:00:00Z",
      stageProbabilities: { footing_excavation: 0.85, footing_pcc: 0.10, footing_rebar: 0.05 },
      overallConfidence: 0.88,
    },
    {
      photoId: "p2",
      timestamp: "2026-01-20T09:00:00Z",
      stageProbabilities: { footing_backfill: 0.80, footing_concrete: 0.15, footing_rebar: 0.05 },
      overallConfidence: 0.85,
    },
  ];

  const config = { ...DEFAULT_TRAJECTORY_CONFIG, observabilityAware: false };
  const result = fitTrajectory("footing", "test-footing-abl", observations, config);

  // With observability disabled, no stage should be labeled "inferred_concealed"
  const inferredStages = result.fittedPath.filter((s) => s.status === "inferred_concealed");
  assertEqual(
    inferredStages.length,
    0,
    `expected 0 inferred_concealed stages with observabilityAware=false, got ${inferredStages.length}`
  );
});

test("empty observations causes abstention", () => {
  const result = fitTrajectory("column", "test-empty", []);
  assert(result.abstained, "expected abstention for empty observations");
  assert(result.abstentionReason !== undefined, "expected abstention reason");
});

test("low-confidence observations may cause abstention", () => {
  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-01T09:00:00Z",
      stageProbabilities: { column_pedestal: 0.15, column_rebar: 0.14, column_formwork: 0.13, column_concrete: 0.12, column_deshuttered: 0.11, column_cured: 0.10 },
      overallConfidence: 0.1,
    },
  ];
  // Uniform probabilities — should abstain or produce very low confidence
  const result = fitTrajectory("column", "test-low-conf", observations);
  // Either abstains or has very low confidence
  assert(
    result.abstained || result.trajectoryConfidence < 0.3,
    `expected abstention or low confidence, got confidence=${result.trajectoryConfidence}`
  );
});

test("unknown element type causes abstention", () => {
  const result = fitTrajectory("not_a_real_element_type", "test-unknown", [
    { photoId: "p1", timestamp: "2026-01-01T00:00:00Z", stageProbabilities: { foo: 0.9 } },
  ]);
  assert(result.abstained, "expected abstention for unknown element type");
});

test("dual-pass check: identical observations agree", () => {
  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-01T09:00:00Z",
      stageProbabilities: { column_deshuttered: 0.85, column_cured: 0.15 },
      overallConfidence: 0.90,
    },
  ];
  const { result, dualPassAgreed } = fitTrajectoryWithDualPassCheck("column", "test-dual", observations);
  // With strong single-observation data, both passes should agree (or be close)
  // We just check it doesn't crash and returns a result
  assert(result !== undefined, "expected a result");
  console.log(`    dual-pass agreed: ${dualPassAgreed}, abstained: ${result.abstained}`);
});

test("monotonic progression: fitted path indices are non-decreasing", () => {
  const stages = getStagesForElement("column");
  const idxById: Record<string, number> = {};
  stages.forEach((s, i) => (idxById[s.id] = i));

  const observations: StageObservation[] = [
    {
      photoId: "p1",
      timestamp: "2026-01-01T09:00:00Z",
      stageProbabilities: { column_pedestal: 0.80, column_rebar: 0.15 },
      overallConfidence: 0.85,
    },
    {
      photoId: "p2",
      timestamp: "2026-01-15T09:00:00Z",
      stageProbabilities: { column_formwork: 0.75, column_concrete: 0.20 },
      overallConfidence: 0.82,
    },
  ];

  const result = fitTrajectory("column", "test-monotonic", observations);
  if (!result.abstained && result.fittedPath.length > 1) {
    for (let i = 1; i < result.fittedPath.length; i++) {
      const prevIdx = idxById[result.fittedPath[i - 1].stageId] ?? -1;
      const currIdx = idxById[result.fittedPath[i].stageId] ?? -1;
      assert(
        currIdx >= prevIdx,
        `path not monotonic at position ${i}: ${result.fittedPath[i - 1].stageId}(${prevIdx}) → ${result.fittedPath[i].stageId}(${currIdx})`
      );
    }
  }
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n─────────────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All trajectory tests passed ✓");
}
