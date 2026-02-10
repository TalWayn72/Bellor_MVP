/**
 * Playwright E2E Test Configuration
 *
 * Two-layer testing strategy:
 * 1. Mocked tests (e2e/*.spec.ts) - Fast UI smoke tests with API mocking
 * 2. Full-stack tests (e2e/full-stack/*.spec.ts) - Real backend integration
 *
 * @see docs/testing/E2E_FULLSTACK.md
 */

import { defineConfig, devices } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isCI = !!process.env.CI;
const isFullStack = !!process.env.FULLSTACK;

export default defineConfig({
  // Look for test files in the e2e directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,

  // Retry on CI only
  retries: isCI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: isCI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',

    // Set default timeout for actions
    actionTimeout: 10000,

    // Set default navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    // === Mocked E2E Tests (fast, no backend needed) ===
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /full-stack/,
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: /full-stack/,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: /full-stack/,
    },
    ...(isCI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testIgnore: /full-stack/,
          },
        ]
      : []),

    // === Full-Stack E2E Tests (real backend required) ===
    {
      name: 'fullstack-setup',
      testMatch: /global-setup\.ts/,
      teardown: 'fullstack-teardown',
    },
    {
      name: 'fullstack-teardown',
      testMatch: /global-teardown\.ts/,
    },
    {
      name: 'fullstack-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: resolve(__dirname, 'playwright/.auth/user.json'),
      },
      testMatch: /full-stack\/.*\.spec\.ts/,
      dependencies: isFullStack ? ['fullstack-setup'] : [],
    },
    {
      name: 'fullstack-mobile',
      use: {
        ...devices['Pixel 5'],
        storageState: resolve(__dirname, 'playwright/.auth/user.json'),
      },
      testMatch: /full-stack\/.*\.spec\.ts/,
      dependencies: isFullStack ? ['fullstack-setup'] : [],
    },
  ],

  // Run your local dev server before starting the tests
  webServer: isCI
    ? undefined
    : [
        {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 120000,
        },
        // For full-stack tests, also start the API
        ...(isFullStack
          ? [
              {
                command: 'npm run dev:api',
                url: 'http://localhost:3000/health',
                reuseExistingServer: true,
                timeout: 120000,
              },
            ]
          : []),
      ],

  // Global timeout for each test
  timeout: 60000,

  // Global setup/teardown for full-stack tests
  ...(isFullStack
    ? {
        globalSetup: resolve(__dirname, 'e2e/global-setup.ts'),
        globalTeardown: resolve(__dirname, 'e2e/global-teardown.ts'),
      }
    : {}),

  // Expect timeout
  expect: {
    timeout: 10000,
    // Visual regression screenshot comparison settings
    toHaveScreenshot: {
      // Maximum number of pixels that can differ
      maxDiffPixels: 100,
      // Threshold for pixel difference (0-1, where 0 is identical)
      threshold: 0.2,
      // Enable animations to complete before screenshot
      animations: 'disabled',
    },
  },

  // Screenshot directory for visual regression tests
  snapshotDir: './e2e/visual/snapshots',
});
