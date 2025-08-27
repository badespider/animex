import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3001";

test("Search shows results", async ({ page }) => {
  await page.goto(`${BASE}/search`);
  await page.getByLabel("Search anime").fill("naruto");
  await page.waitForTimeout(800);
  await expect(page.getByRole("listbox", { name: "Search results" })).toBeVisible();
});

