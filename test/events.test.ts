import test from "node:test";
import assert from "node:assert/strict";
import { eventBus, BuildMeEvent } from "../src/lib/events";

test("Realtime Event Bus", async (t) => {
  await t.test("broadcasts and receives global events", (t, done) => {
    const handler = (event: BuildMeEvent) => {
      if (event.type === "task_updated") {
        assert.equal(event.projectId, "proj-global-test");
        assert.equal(event.payload.taskId, "task-99");
        eventBus.off("event", handler);
        done();
      }
    };

    eventBus.on("event", handler);

    eventBus.broadcast({
      type: "task_updated",
      projectId: "proj-global-test",
      payload: { taskId: "task-99" },
    });
  });

  await t.test("broadcasts to project-specific channels", (t, done) => {
    const targetProject = "proj-specific-42";

    const handler = (event: BuildMeEvent) => {
      assert.equal(event.projectId, targetProject);
      assert.equal(event.payload.alertLevel, "HIGH");
      eventBus.off(`project:${targetProject}`, handler);
      done();
    };

    eventBus.on(`project:${targetProject}`, handler);

    eventBus.broadcast({
      type: "risk_alert",
      projectId: targetProject,
      payload: { alertLevel: "HIGH" },
    });
  });
});
