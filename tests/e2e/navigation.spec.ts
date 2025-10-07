import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // Check overview page loads
    await expect(page).toHaveTitle(/FeeMGR/);
    await expect(page.locator('h1')).toContainText('Overview');

    // Navigate to Import page
    await page.click('text=Import');
    await expect(page.locator('h1')).toContainText('Import');

    // Navigate to Clients page
    await page.click('text=Clients');
    await expect(page.locator('h1')).toContainText('Client Management');

    // Navigate to Fee Schedules
    await page.click('text=Fee Schedules');
    await expect(page.locator('h1')).toContainText('Fee Schedules');
  });
});
