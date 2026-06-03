import { describe, it, expect } from "vitest";

const BASE_URL = process.env.API_URL || "http://localhost:8080";

describe("GET /api/status/version — contract", () => {
  it("returns 200 with JSON content type", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("response body matches the expected schema", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    const body = await res.json();

    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("buildTimestamp");
    expect(body).toHaveProperty("nodeVersion");

    expect(typeof body.version).toBe("string");
    expect(typeof body.buildTimestamp).toBe("string");
    expect(typeof body.nodeVersion).toBe("string");
  });

  it("does not return extra unexpected fields", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    const body = await res.json();
    const keys = Object.keys(body);

    expect(keys).toContain("version");
    expect(keys).toContain("buildTimestamp");
    expect(keys).toContain("nodeVersion");
    expect(keys.length).toBe(3);
  });

  it("buildTimestamp is a valid ISO 8601 date string", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    const body = await res.json();
    const parsed = new Date(body.buildTimestamp);
    expect(parsed.toISOString()).toBe(body.buildTimestamp);
  });

  it("nodeVersion starts with 'v'", async () => {
    const res = await fetch(`${BASE_URL}/api/status/version`);
    const body = await res.json();
    expect(body.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});
