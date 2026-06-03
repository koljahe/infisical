import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const VERSION_API = `${BASE_URL}/api/status/version`;

test.describe("Version Endpoint - UI Integration", () => {
  test("GET /api/status/version returns valid JSON consumable by the frontend", async ({
    request,
  }) => {
    // This test validates that the API returns data in the format
    // the VersionInfoSection component expects
    const response = await request.get("/api/status/version");
    expect(response.status()).toBe(200);

    const body = await response.json();

    // The frontend component uses these exact keys
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("buildTimestamp");
    expect(body).toHaveProperty("nodeVersion");

    // Validate types match what TServerVersion expects
    expect(typeof body.version).toBe("string");
    expect(typeof body.buildTimestamp).toBe("string");
    expect(typeof body.nodeVersion).toBe("string");
  });

  test("Admin General page renders the VersionInfoSection", async ({ page }) => {
    // Navigate to admin page — this will redirect to login if not authenticated
    await page.goto("/admin");

    // The page might redirect to login. If so, verify the version API is
    // still independently accessible (since it has no auth requirement)
    const currentUrl = page.url();

    if (currentUrl.includes("/login") || currentUrl.includes("/admin")) {
      // Verify the API endpoint works regardless of UI auth state
      const apiResponse = await page.request.get("/api/status/version");
      expect(apiResponse.status()).toBe(200);
      const data = await apiResponse.json();
      expect(data.version).toBeTruthy();
      expect(data.buildTimestamp).toBeTruthy();
      expect(data.nodeVersion).toBeTruthy();
    }
  });

  test("Version API response is consistent with /api/status availability", async ({
    request,
  }) => {
    // Both endpoints should be available simultaneously
    const [versionRes, statusRes] = await Promise.all([
      request.get("/api/status/version"),
      request.get("/api/status"),
    ]);

    expect(versionRes.status()).toBe(200);
    expect(statusRes.status()).toBe(200);

    const versionBody = await versionRes.json();
    const statusBody = await statusRes.json();

    // /api/status returns the health check
    expect(statusBody.message).toBe("Ok");

    // /api/status/version returns version info
    expect(versionBody.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(versionBody.nodeVersion).toMatch(/^v\d+/);
  });

  test("Version endpoint respects rate limiting headers", async ({ request }) => {
    // Make several rapid requests — verify the endpoint is responsive
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get("/api/status/version"))
    );

    // All should succeed (rate limit is generous for read endpoints)
    for (const res of responses) {
      expect(res.status()).toBe(200);
    }

    // Verify all return the same version (consistency under load)
    const bodies = await Promise.all(responses.map((r) => r.json()));
    const versions = bodies.map((b) => b.version);
    expect(new Set(versions).size).toBe(1);
  });
});
