import { test, expect } from '@playwright/test';

test('has title and upload area', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/InsightFlow/);

  // Expect the hero section or upload drag area to be visible
  const uploadArea = page.locator('text=Drag & drop your dataset here');
  await expect(uploadArea).toBeVisible();
});
