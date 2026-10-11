import test from "node:test";
import assert from "node:assert/strict";
import {
  fitTrajectoryWithDualPassCheck,
  DEFAULT_TRAJECTORY_CONFIG,
  type StageObservation,
} from "../src/lib/stage-graph/trajectory";

test("Track 2 Trajectory HMM Engine", async (t) => {
  await t.test("fits a clean monotonic forward progression for a column", () => {
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

    const { result, dualPassAgreed } = fitTrajectoryWithDualPassCheck(
      "column",
      "elem-col-1",
      observations,
      DEFAULT_TRAJECTORY_CONFIG
    );

    assert.equal(result.abstained, false);
    assert.equal(dualPassAgreed, true);
    assert.ok(result.currentStage !== null);
    assert.ok(result.trajectoryConfidence > 0.5);
    assert.ok(result.fittedPath.length >= 1);
  });

  await t.test("abstains when observations are empty or missing", () => {
    const { result } = fitTrajectoryWithDualPassCheck(
      "column",
      "elem-col-2",
      [],
      DEFAULT_TRAJECTORY_CONFIG
    );

    assert.equal(result.abstained, true);
    assert.ok(result.abstentionReason !== null);
  });

  await t.test("abstains on low confidence observations below threshold", () => {
    const observations: StageObservation[] = [
      {
        photoId: "p_low",
        timestamp: "2026-03-01T10:00:00Z",
        stageProbabilities: { column_pedestal: 0.02, column_rebar: 0.01 },
        overallConfidence: 0.02,
      },
    ];

    const strictConfig = {
      ...DEFAULT_TRAJECTORY_CONFIG,
      abstentionThreshold: 0.8,
    };

    const { result } = fitTrajectoryWithDualPassCheck(
      "column",
      "elem-col-3",
      observations,
      strictConfig
    );

    assert.equal(result.abstained, true);
  });
});
