import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, assertClearError } from "./helpers.js";

let api;
let projectId;
const valid = () => ({ project_id: projectId, name: "User login", description: "Sign in", type: "functional", estimate: 8 });

before(async () => {
  api = await startTestServer();
  projectId = (await api.post("/api/projects", { name: "Requirements Test" })).body.project_id;
});
after(async () => { await api.close(); });

describe("POST /api/requirements (FR03, FR10)", () => {
  test("creates a functional requirement with an estimate", async () => {
    const res = await api.post("/api/requirements", valid());
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.requirement_id, "number");
    assert.equal(res.body.type, "functional");
  });

  test("creates a non-functional requirement without an estimate", async () => {
    const res = await api.post("/api/requirements", { project_id: projectId, name: "Fast pages", type: "non-functional" });
    assert.equal(res.status, 201);
    const saved = await api.get(`/api/requirements/${res.body.requirement_id}`);
    assert.equal(saved.body.estimate, null);
  });

  test("accepts an estimate of 0", async () => {
    const res = await api.post("/api/requirements", { ...valid(), estimate: 0 });
    assert.equal(res.status, 201);
  });

  test("saved requirement can be read back (NFR02)", async () => {
    const created = await api.post("/api/requirements", valid());
    const res = await api.get(`/api/requirements/${created.body.requirement_id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, "User login");
    assert.equal(res.body.estimate, 8);
    assert.equal(res.body.project_id, projectId);
  });

  test("rejects a missing project_id", async () => {
    const { project_id, ...body } = valid();
    assertClearError(assert, await api.post("/api/requirements", body));
  });

  test("rejects a project that does not exist", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), project_id: 99999 }));
  });

  test("rejects a missing name", async () => {
    const { name, ...body } = valid();
    assertClearError(assert, await api.post("/api/requirements", body));
  });

  test("rejects a blank name", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), name: " " }));
  });

  test("rejects a missing type", async () => {
    const { type, ...body } = valid();
    assertClearError(assert, await api.post("/api/requirements", body));
  });

  test("rejects an invalid type (wrong case)", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), type: "Functional" }));
  });

  test("rejects a negative estimate", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), estimate: -1 }));
  });

  test("rejects a non-numeric estimate", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), estimate: "abc" }));
  });
});

describe("POST /api/requirements: planned validation (currently failing)", () => {
  test("rejects a non-text name", async () => {
    assertClearError(assert, await api.post("/api/requirements", { ...valid(), name: 7 }));
  });
});
