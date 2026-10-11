import test from "node:test";
import assert from "node:assert/strict";
import { getLocalVarianceFactor, TAMIL_NADU_SPOT_BENCHMARKS } from "../src/lib/cost/spot-market";

test("Local Spot Market Calibration Engine", async (t) => {
  await t.test("loads benchmark data for key Tamil Nadu construction hubs", () => {
    assert.ok(TAMIL_NADU_SPOT_BENCHMARKS.coimbatore);
    assert.ok(TAMIL_NADU_SPOT_BENCHMARKS.trichy);
    assert.ok(TAMIL_NADU_SPOT_BENCHMARKS.salem);
    assert.equal(TAMIL_NADU_SPOT_BENCHMARKS.coimbatore.district, "Coimbatore");
  });

  await t.test("computes local variance multiplier correctly", () => {
    const { factor, explanation, spotRate } = getLocalVarianceFactor("Coimbatore");
    assert.equal(typeof factor, "number");
    assert.ok(factor > 0.8 && factor < 1.3);
    assert.ok(explanation.includes("Coimbatore"));
    assert.equal(spotRate.district, "Coimbatore");
  });

  await t.test("gracefully falls back to regional benchmark for unknown district", () => {
    const { factor, spotRate } = getLocalVarianceFactor("UnknownDistrictXYZ");
    assert.ok(factor > 0);
    assert.equal(spotRate.district, "Tiruchirappalli");
  });
});
