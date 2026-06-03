import { describe, it, expect } from "vitest";

const BASE_URL = process.env.API_URL || "http://localhost:8080";

describe("GET /api/status/version — integration", () => {
  it("is publicly accessible without authentication", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    expect(res.status).toBe(200);
  });

  it("returns consistent data across multiple calls", async () => {
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/status/version`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/status/version`).then((r) => r.json()),
    ]);

    expect(res1.nodeVersion).toBe(res2.nodeVersion);
    expect(res1.version).toBe(res2.version);
  });

  it("version is 'unknown' when INFISICAL_PLATFORM_VERSION is not set", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    const body = await res.json();
    // In the BDD env, this env var is not set
    expect(body.version).toBe("unknown");
  });

  it("does not accept POST method", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`, { method: "POST" });
    // Fastify returns 404 for unregistered method+url combinations
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("handles concurrent requests without errors", async () => {
    const requests = Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/api/status/version`)
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });

  it("existing /api/status endpoint still works", async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Ok");
  });
});
