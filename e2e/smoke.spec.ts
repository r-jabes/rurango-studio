import { expect, test } from "@playwright/test";

const e2eEnabled = Boolean(process.env.STUDIO_E2E_BASE_URL);

test.describe("Studio smoke", () => {
  test.skip(!e2eEnabled, "Set STUDIO_E2E_BASE_URL to run Playwright smoke tests");

  test("login is reachable without a session", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/clients");
    await expect(page).toHaveURL(/\/login/);
  });
});
