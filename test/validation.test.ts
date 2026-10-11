import test from "node:test";
import assert from "node:assert/strict";
import {
  validateSchema,
  createProjectSchema,
  createCheckinSchema,
  createInspectionSchema,
} from "../src/lib/validation";

test("Validation: Project Schema", async (t) => {
  await t.test("accepts valid project payload", () => {
    const valid = {
      name: "Apartment Tower A",
      address: "123 Marina Street, Chennai",
      budget: 15000000,
      clientName: "Rajan K",
      clientEmail: "rajan@example.com",
    };
    const res = validateSchema(createProjectSchema, valid);
    assert.equal(res.success, true);
    assert.equal(res.data?.name, "Apartment Tower A");
  });

  await t.test("rejects project payload with empty name", () => {
    const invalid = {
      name: "",
      address: "123 Marina Street",
    };
    const res = validateSchema(createProjectSchema, invalid);
    assert.equal(res.success, false);
    assert.ok(res.errors && res.errors.length > 0);
  });
});

test("Validation: Check-in Schema", async (t) => {
  await t.test("accepts valid check-in with GPS coords", () => {
    const valid = {
      workerId: "cuid-worker-1",
      projectId: "proj-101",
      latitude: 13.0827,
      longitude: 80.2707,
    };
    const res = validateSchema(createCheckinSchema, valid);
    assert.equal(res.success, true);
  });

  await t.test("rejects invalid GPS coordinates", () => {
    const invalid = {
      workerId: "cuid-worker-1",
      projectId: "proj-101",
      latitude: 195.0, // Invalid latitude > 90
      longitude: 80.2707,
    };
    const res = validateSchema(createCheckinSchema, invalid);
    assert.equal(res.success, false);
  });
});

test("Validation: Inspection Schema", async (t) => {
  await t.test("validates valid inspection data", () => {
    const valid = {
      projectId: "proj-101",
      stage: "foundation",
      notes: "First floor slab rebar completed and checked.",
    };
    const res = validateSchema(createInspectionSchema, valid);
    assert.equal(res.success, true);
  });
});
