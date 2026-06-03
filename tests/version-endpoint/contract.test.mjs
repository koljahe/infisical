/**
 * Contract tests for GET /api/status/version
 * Validates the response schema matches the documented contract.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const ENDPOINT = `${BASE_URL}/api/status/version`;

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

async function runContractTests() {
  console.log("Contract Tests: GET /api/status/version\n");

  // Fetch the endpoint
  const res = await fetch(ENDPOINT);
  const body = await res.json();

  console.log("Response:", JSON.stringify(body, null, 2), "\n");

  // 1. Status code
  assert(res.status === 200, `Status code is 200 (got ${res.status})`);

  // 2. Content-Type
  const contentType = res.headers.get("content-type");
  assert(
    contentType && contentType.includes("application/json"),
    `Content-Type is application/json (got ${contentType})`
  );

  // 3. Response body has exactly the expected keys
  const expectedKeys = ["version", "buildTimestamp", "nodeVersion"];
  const actualKeys = Object.keys(body).sort();
  const sortedExpected = [...expectedKeys].sort();
  assert(
    JSON.stringify(actualKeys) === JSON.stringify(sortedExpected),
    `Response has exactly keys: ${expectedKeys.join(", ")} (got ${actualKeys.join(", ")})`
  );

  // 4. "version" field is a non-empty string matching semver pattern
  assert(
    typeof body.version === "string" && body.version.length > 0,
    `"version" is a non-empty string (got "${body.version}")`
  );
  const semverPattern = /^\d+\.\d+\.\d+/;
  assert(
    semverPattern.test(body.version),
    `"version" matches semver pattern (got "${body.version}")`
  );

  // 5. "buildTimestamp" field is a valid ISO 8601 timestamp
  assert(
    typeof body.buildTimestamp === "string" && body.buildTimestamp.length > 0,
    `"buildTimestamp" is a non-empty string (got "${body.buildTimestamp}")`
  );
  const parsedDate = new Date(body.buildTimestamp);
  assert(
    !isNaN(parsedDate.getTime()),
    `"buildTimestamp" is a valid ISO 8601 date (got "${body.buildTimestamp}")`
  );
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  assert(
    isoPattern.test(body.buildTimestamp),
    `"buildTimestamp" matches ISO format (got "${body.buildTimestamp}")`
  );

  // 6. "nodeVersion" field starts with "v" followed by a version number
  assert(
    typeof body.nodeVersion === "string" && body.nodeVersion.length > 0,
    `"nodeVersion" is a non-empty string (got "${body.nodeVersion}")`
  );
  const nodeVersionPattern = /^v\d+\.\d+\.\d+$/;
  assert(
    nodeVersionPattern.test(body.nodeVersion),
    `"nodeVersion" matches vX.Y.Z pattern (got "${body.nodeVersion}")`
  );

  // Summary
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runContractTests().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
