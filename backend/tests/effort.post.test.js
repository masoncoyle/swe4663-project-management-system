import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, assertClearError, localDate } from "./helpers.js";

let api;
let requirementId;
let memberId;
let otherProjectMemberId;
const valid = () => ({
  requirement_id: requirementId,
  member_id: memberId,
  phase: "Coding",
  hours: 2,
  date: localDate(-1),
});

before(async () => {
  api = await startTestServer();
  const projectId = (await api.post("/api/projects", { name: "Effort Test" })).body.project_id;
  requirementId = (await api.post("/api/requirements", { project_id: projectId, name: "Login", type: "functional" })).body.requirement_id;
  memberId = (await api.post("/api/members", { project_id: projectId, name: "Ann Lee" })).body.member_id;

  const otherProjectId = (await api.post("/api/projects", { name: "Other Project" })).body.project_id;
  otherProjectMemberId = (await api.post("/api/members", { project_id: otherProjectId, name: "Outsider" })).body.member_id;
});
after(async () => { await api.close(); });

describe("POST /api/effort (FR04, NFR04)", () => {
  test("creates an effort entry", async () => {
    const res = await api.post("/api/effort", valid());
    assert.equal(res.status, 201);
    assert.equal(typeof res.body.effort_id, "number");
    assert.equal(res.body.phase, "Coding");
  });

  test("accepts decimal hours", async () => {
    const res = await api.post("/api/effort", { ...valid(), hours: 1.5 });
    assert.equal(res.status, 201);
  });

  test("accepts 168 hours (one full week, the agreed maximum)", async () => {
    assert.equal((await api.post("/api/effort", { ...valid(), hours: 168 })).status, 201);
  });

  test("accepts today's date", async () => {
    const res = await api.post("/api/effort", { ...valid(), date: localDate(0) });
    assert.equal(res.status, 201);
  });

  for (const phase of ["Requirements Analysis", "Design", "Coding", "Testing", "Project Management"]) {
    test(`accepts phase "${phase}"`, async () => {
      assert.equal((await api.post("/api/effort", { ...valid(), phase })).status, 201);
    });
  }

  test("saved entry can be read back (NFR02)", async () => {
    const created = await api.post("/api/effort", { ...valid(), hours: 3.25, phase: "Testing" });
    const res = await api.get(`/api/effort/${created.body.effort_id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.hours, 3.25);
    assert.equal(res.body.phase, "Testing");
    assert.equal(res.body.requirement_id, requirementId);
    assert.equal(res.body.member_id, memberId);
  });

  test("rejects a missing requirement_id", async () => {
    const { requirement_id, ...body } = valid();
    assertClearError(assert, await api.post("/api/effort", body));
  });

  test("rejects a requirement that does not exist", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), requirement_id: 99999 }));
  });

  test("rejects a missing member_id", async () => {
    const { member_id, ...body } = valid();
    assertClearError(assert, await api.post("/api/effort", body));
  });

  test("rejects a member that does not exist", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), member_id: 99999 }));
  });

  test("rejects a missing phase", async () => {
    const { phase, ...body } = valid();
    assertClearError(assert, await api.post("/api/effort", body));
  });

  test("rejects an invalid phase (wrong case)", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), phase: "coding" }));
  });

  test("rejects missing hours", async () => {
    const { hours, ...body } = valid();
    assertClearError(assert, await api.post("/api/effort", body));
  });

  for (const bad of [0, -1, "abc", ""]) {
    test(`rejects hours = ${JSON.stringify(bad)}`, async () => {
      assertClearError(assert, await api.post("/api/effort", { ...valid(), hours: bad }));
    });
  }

  test("rejects a missing date", async () => {
    const { date, ...body } = valid();
    assertClearError(assert, await api.post("/api/effort", body));
  });
});

describe("POST /api/effort: planned validation (currently failing)", () => {
  test("rejects more than 168 hours", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), hours: 168.5 }));
  });

  test("rejects a future date", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), date: localDate(1) }));
  });

  test("rejects an empty date", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), date: "" }));
  });

  test("rejects a date that is not YYYY-MM-DD", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), date: "banana" }));
  });

  test("rejects an impossible date", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), date: "2026-02-30" }));
  });

  test("rejects a member from a different project than the requirement", async () => {
    assertClearError(assert, await api.post("/api/effort", { ...valid(), member_id: otherProjectMemberId }));
  });
});
