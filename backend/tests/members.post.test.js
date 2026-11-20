import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, assertClearError } from "./helpers.js";

let api;
let projectId;
before(async () => {
  api = await startTestServer();
  projectId = (await api.post("/api/projects", { name: "Members Test" })).body.project_id;
});
after(async () => { await api.close(); });

describe("POST /api/members (FR02)", () => {
  test("creates a member, active by default", async () => {
    const res = await api.post("/api/members", { project_id: projectId, name: "Ann Lee" });
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.member_id, "number");
    assert.equal(res.body.active_status, "active");
  });

  test("creates an inactive member", async () => {
    const res = await api.post("/api/members", { project_id: projectId, name: "Ben Ortiz", active_status: "inactive" });
    assert.equal(res.status, 201);
    assert.equal(res.body.active_status, "inactive");
  });

  test("saved member can be read back (NFR02)", async () => {
    const created = await api.post("/api/members", { project_id: projectId, name: "Cara Kim" });
    const res = await api.get(`/api/members/${created.body.member_id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Cara Kim");
    assert.equal(res.body.project_id, projectId);
  });

  test("rejects a missing project_id", async () => {
    assertClearError(assert, await api.post("/api/members", { name: "No Project" }));
  });

  test("rejects a project that does not exist", async () => {
    assertClearError(assert, await api.post("/api/members", { project_id: 99999, name: "Ghost" }));
  });

  test("rejects a missing name", async () => {
    assertClearError(assert, await api.post("/api/members", { project_id: projectId }));
  });

  test("rejects a blank name", async () => {
    assertClearError(assert, await api.post("/api/members", { project_id: projectId, name: "  " }));
  });

  test("rejects an invalid active_status", async () => {
    assertClearError(assert, await api.post("/api/members", { project_id: projectId, name: "X", active_status: "away" }));
  });
});

describe("POST /api/members: planned validation (currently failing)", () => {
  test("rejects a non-text name", async () => {
    assertClearError(assert, await api.post("/api/members", { project_id: projectId, name: 42 }));
  });
});
