import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, assertClearError } from "./helpers.js";

let api;
let projectId;
const valid = () => ({
  project_id: projectId,
  name: "Schedule slip",
  description: "Team may miss the integration date",
  priority: "high",
  probability: 3,
  impact: 4,
});

before(async () => {
  api = await startTestServer();
  projectId = (await api.post("/api/projects", { name: "Risks Test" })).body.project_id;
});
after(async () => { await api.close(); });

describe("POST /api/risks (FR07, FR11)", () => {
  test("creates a risk with status 'open'", async () => {
    const res = await api.post("/api/risks", valid());
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.risk_id, "number");
    assert.equal(res.body.status, "open");
  });

  test("priority is optional", async () => {
    const { priority, ...body } = valid();
    const res = await api.post("/api/risks", body);
    assert.equal(res.status, 201);
  });

  test("accepts the edges of the 1-5 scale", async () => {
    assert.equal((await api.post("/api/risks", { ...valid(), probability: 1, impact: 5 })).status, 201);
    assert.equal((await api.post("/api/risks", { ...valid(), probability: 5, impact: 1 })).status, 201);
  });

  test("saved risk can be read back (NFR02)", async () => {
    const created = await api.post("/api/risks", valid());
    const res = await api.get(`/api/risks/${created.body.risk_id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Schedule slip");
    assert.equal(res.body.probability, 3);
    assert.equal(res.body.impact, 4);
  });

  test("rejects a missing name", async () => {
    const { name, ...body } = valid();
    assertClearError(assert, await api.post("/api/risks", body));
  });

  test("rejects a blank name", async () => {
    assertClearError(assert, await api.post("/api/risks", { ...valid(), name: "" }));
  });

  test("rejects a missing project_id", async () => {
    const { project_id, ...body } = valid();
    assertClearError(assert, await api.post("/api/risks", body));
  });

  test("rejects a project that does not exist", async () => {
    assertClearError(assert, await api.post("/api/risks", { ...valid(), project_id: 99999 }));
  });

  test("rejects an invalid priority", async () => {
    assertClearError(assert, await api.post("/api/risks", { ...valid(), priority: "urgent" }));
  });

  for (const field of ["probability", "impact"]) {
    test(`rejects a missing ${field}`, async () => {
      const body = valid();
      delete body[field];
      assertClearError(assert, await api.post("/api/risks", body));
    });
    for (const bad of [0, 6, 2.5, "abc"]) {
      test(`rejects ${field} = ${JSON.stringify(bad)}`, async () => {
        assertClearError(assert, await api.post("/api/risks", { ...valid(), [field]: bad }));
      });
    }
  }
});

describe("POST /api/risks: planned validation (currently failing)", () => {
  test("rejects a non-text name", async () => {
    assertClearError(assert, await api.post("/api/risks", { ...valid(), name: 5 }));
  });
});
