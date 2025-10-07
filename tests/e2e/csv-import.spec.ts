import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CSV Import', () => {
  test('should import balance data', async ({ page }) => {
    await page.goto('/import');

    // Upload test CSV file
    const filePath = path.join(__dirname, '../fixtures/test_balances.csv');
    await page.setInputFiles('input[type="file"]', filePath);

    // Wait for processing
    await page.waitForSelector('.success-message', { timeout: 10000 });

    // Verify import success
    await expect(page.locator('.success-message')).toContainText('imported successfully');

    // Check data appears in table
    await page.click('text=Balance Data');
    await expect(page.locator('table tbody tr')).toHaveCount({ minimum: 1 });
  });
});
