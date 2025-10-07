import { test, expect } from '@playwright/test';

test.describe('Fee Calculation', () => {
  test('should calculate fees correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to fee calculator
    await page.click('text=Fee Calculator');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Fee Calculator")');

    // Select a billing period
    await page.selectOption('select[name="billingPeriod"]', 'Q4-2024');

    // Click calculate button
    await page.click('button:has-text("Calculate Fees")');

    // Wait for results
    await page.waitForSelector('.fee-results', { timeout: 5000 });

    // Verify results displayed
    const totalFees = await page.locator('.total-fees').textContent();
    expect(totalFees).toMatch(/\$[\d,]+/);
  });
});
