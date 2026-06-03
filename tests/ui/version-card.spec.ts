import { test, expect } from "@playwright/test";

test.describe("Admin Version Info Card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");

    // Email and password are on the same form; submit button is "Continue with Email"
    await page.getByPlaceholder("Enter your email...").fill("admin@test.com");
    await page.getByPlaceholder("Enter your password...").fill("Password123!");
    await page.getByRole("button", { name: /continue with email/i }).click();

    // Wait for navigation after login
    await page.waitForURL("**/organizations/**", { timeout: 30000 });
  });

  test("version info card is visible on admin page", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText("Server Version")).toBeVisible({ timeout: 15000 });
  });

  test("version info card shows version fields", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText("Server Version")).toBeVisible({ timeout: 15000 });

    await expect(page.getByText("Version", { exact: true })).toBeVisible();
    await expect(page.getByText("Build Timestamp")).toBeVisible();
    await expect(page.getByText("Node Version")).toBeVisible();
  });

  test("version info card shows correct node version", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText("Server Version")).toBeVisible({ timeout: 15000 });

    // Node version should match format vX.Y.Z
    await expect(page.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();
  });

  test("version info card shows 'unknown' when version env is unset", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText("Server Version")).toBeVisible({ timeout: 15000 });

    // In BDD env, INFISICAL_PLATFORM_VERSION is not set
    await expect(page.getByText("unknown")).toBeVisible();
  });
});
