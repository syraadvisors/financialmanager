/**
 * Playwright E2E Test Configuration
 *
 * Setup Instructions:
 * 1. Install Playwright: npm install --save-dev @playwright/test
 * 2. Install browsers: npx playwright install
 * 3. Add scripts to package.json:
 *    "test:e2e": "playwright test",
 *    "test:e2e:ui": "playwright test --ui",
 *    "test:e2e:headed": "playwright test --headed",
 *    "test:e2e:debug": "playwright test --debug",
 *    "test:e2e:report": "playwright show-report"
 * 4. Run tests: npm run test:e2e
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if tests fail
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporters
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    // Base URL for your app
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
