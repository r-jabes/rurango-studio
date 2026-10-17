import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke e2e. Default `npm test` is Vitest only.
 * Run with: STUDIO_E2E_BASE_URL=http://localhost:3001 npm run test:e2e
 * (App must already be running; this suite does not start Next.)
 */
const baseURL = process.env.STUDIO_E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: baseURL || "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
