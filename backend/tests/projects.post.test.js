import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, assertClearError } from "./helpers.js";

let api;
before(async () => { api = await startTestServer(); });
after(async () => { await api.close(); });

describe("POST /api/projects (FR01)", () => {
  test("creates a project with all fields", async () => {
    const res = await api.post("/api/projects", {
      name: "Campus Planner",
      description: "Event scheduling app",
      owner_name: "Dana Reyes",
    });
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.project_id, "number");
    assert.equal(res.body.name, "Campus Planner");
    assert.equal(res.body.owner_name, "Dana Reyes");
  });

  test("description and owner are optional", async () => {
    const res = await api.post("/api/projects", { name: "Name Only" });
    assert.equal(res.status, 201);
  });

  test("saved project can be read back (NFR02)", async () => {
    const created = await api.post("/api/projects", { name: "Persisted", description: "d", owner_name: "o" });
    const res = await api.get(`/api/projects/${created.body.project_id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Persisted");
    assert.equal(res.body.description, "d");
    assert.equal(res.body.owner_name, "o");
  });

  test("rejects a missing name", async () => {
    assertClearError(assert, await api.post("/api/projects", { description: "no name" }));
  });

  test("rejects a blank name", async () => {
    assertClearError(assert, await api.post("/api/projects", { name: "   " }));
  });
});

describe("POST /api/projects: planned validation (currently failing)", () => {
  test("rejects a non-text name", async () => {
    assertClearError(assert, await api.post("/api/projects", { name: 123 }));
  });
});
