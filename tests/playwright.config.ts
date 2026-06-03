import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./ui",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
});
