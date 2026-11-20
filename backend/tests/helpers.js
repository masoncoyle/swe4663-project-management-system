// Shared setup for the API tests.
//
// db.js opens "projects.db" in the current working directory, so each test file
// moves into its own empty temp folder BEFORE loading the routes. That way tests
// get a fresh database and never touch the dev projects.db.
// (node --test runs every test file in a separate process, so this is safe.)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export async function startTestServer() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pms-test-"));
  process.chdir(tempDir);

  // Imported after chdir on purpose (see note above)
  const { default: express } = await import("express");
  const routers = {};
  for (const name of ["projects", "members", "requirements", "effort", "risks", "reports"]) {
    routers[name] = (await import(`../routes/${name}.js`)).default;
  }

  // Same middleware and mount paths as server.js
  const app = express();
  app.use(express.json());
  for (const [name, router] of Object.entries(routers)) {
    app.use(`/api/${name}`, router);
  }

  const server = app.listen(0); // 0 = any free port, so it never clashes with the dev server
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://localhost:${server.address().port}`;

  async function request(method, url, body) {
    const response = await fetch(baseUrl + url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text; // e.g. Express's HTML error page
    }
    return { status: response.status, body: data };
  }

  return {
    get: (url) => request("GET", url),
    post: (url, body) => request("POST", url, body),
    async close() {
      await new Promise((resolve) => server.close(resolve));
      process.chdir(os.tmpdir());
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}

// A 400 response should carry a readable message for the user (NFR04)
export function assertClearError(assert, response) {
  assert.equal(response.status, 400, `expected 400, got ${response.status}: ${JSON.stringify(response.body)}`);
  assert.equal(typeof response.body?.error, "string", "expected a JSON { error } message");
  assert.ok(response.body.error.length > 0, "error message should not be empty");
}

// YYYY-MM-DD in local time, offset by a number of days from today
export function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-CA");
}
