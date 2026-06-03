/**
 * Integration tests for GET /api/status/version
 * Tests behavioral characteristics: idempotency, no-auth requirement,
 * method restrictions, and consistency with /api/status.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const VERSION_ENDPOINT = `${BASE_URL}/api/status/version`;
const STATUS_ENDPOINT = `${BASE_URL}/api/status`;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

async function runIntegrationTests() {
  console.log("Integration Tests: GET /api/status/version\n");

  // 1. No authentication required
  console.log("--- No-auth access ---");
  const noAuthRes = await fetch(VERSION_ENDPOINT);
  assert(noAuthRes.status === 200, "Accessible without authentication");

  // 2. Idempotency — multiple requests return consistent structure
  console.log("\n--- Idempotency ---");
  const res1 = await fetch(VERSION_ENDPOINT);
  const body1 = await res1.json();
  const res2 = await fetch(VERSION_ENDPOINT);
  const body2 = await res2.json();

  assert(body1.version === body2.version, `"version" is stable across requests ("${body1.version}")`);
  assert(body1.nodeVersion === body2.nodeVersion, `"nodeVersion" is stable across requests ("${body1.nodeVersion}")`);

  // 3. HTTP method restrictions
  console.log("\n--- Method restrictions ---");
  const postRes = await fetch(VERSION_ENDPOINT, { method: "POST" });
  assert(
    postRes.status === 404 || postRes.status === 405,
    `POST returns 404 or 405 (got ${postRes.status})`
  );

  const putRes = await fetch(VERSION_ENDPOINT, { method: "PUT" });
  assert(
    putRes.status === 404 || putRes.status === 405,
    `PUT returns 404 or 405 (got ${putRes.status})`
  );

  const deleteRes = await fetch(VERSION_ENDPOINT, { method: "DELETE" });
  assert(
    deleteRes.status === 404 || deleteRes.status === 405,
    `DELETE returns 404 or 405 (got ${deleteRes.status})`
  );

  // 4. HEAD request works (same as GET but no body)
  const headRes = await fetch(VERSION_ENDPOINT, { method: "HEAD" });
  assert(
    headRes.status === 200,
    `HEAD returns 200 (got ${headRes.status})`
  );

  // 5. Consistency with /api/status — both endpoints available
  console.log("\n--- Coexistence with /api/status ---");
  const statusRes = await fetch(STATUS_ENDPOINT);
  const statusBody = await statusRes.json();
  assert(statusRes.status === 200, "/api/status still returns 200");
  assert(statusBody.message === "Ok", '/api/status still returns message: "Ok"');

  // 6. Response timing — endpoint responds within reasonable time
  console.log("\n--- Performance ---");
  const start = Date.now();
  await fetch(VERSION_ENDPOINT);
  const elapsed = Date.now() - start;
  assert(elapsed < 2000, `Response time under 2s (got ${elapsed}ms)`);

  // 7. CORS / standard headers
  console.log("\n--- Headers ---");
  const headerRes = await fetch(VERSION_ENDPOINT);
  const xPoweredBy = headerRes.headers.get("x-powered-by");
  // Fastify does not set x-powered-by by default (good security practice)
  assert(
    xPoweredBy === null || xPoweredBy === undefined,
    `No x-powered-by header exposed (got ${xPoweredBy})`
  );

  // 8. Invalid sub-paths return 404
  console.log("\n--- Path specificity ---");
  const subPathRes = await fetch(`${VERSION_ENDPOINT}/extra`);
  assert(subPathRes.status === 404, `/api/status/version/extra returns 404 (got ${subPathRes.status})`);

  const typoRes = await fetch(`${BASE_URL}/api/status/versions`);
  assert(typoRes.status === 404, `/api/status/versions (typo) returns 404 (got ${typoRes.status})`);

  // 9. buildTimestamp is recent (within the last 30 days — sanity check for deployed build)
  console.log("\n--- Timestamp sanity ---");
  const versionRes = await fetch(VERSION_ENDPOINT);
  const versionBody = await versionRes.json();
  const buildTime = new Date(versionBody.buildTimestamp);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  assert(
    buildTime > thirtyDaysAgo,
    `buildTimestamp is within last 30 days (got ${versionBody.buildTimestamp})`
  );

  // Summary
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runIntegrationTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
