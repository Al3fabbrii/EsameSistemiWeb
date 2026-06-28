import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — E2E test suite for the Shop Online project.
 *
 * Runs in two scenarios:
 * 1. Locally: Playwright auto-starts backend (Rails) and frontend (Angular dev server)
 *    via the `webServer` block below.
 * 2. CI: the workflow starts the servers explicitly and Playwright reuses them
 *    (set CI=1 to skip the webServer launch).
 *
 * Test files live under ./e2e and use the @playwright/test runner —
 * NOT to be confused with Vitest, which keeps src/**\/*.spec.ts.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // serial: tests share a single backend DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // single worker to avoid race conditions on shared backend state
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start backend + frontend before running tests.
  // In CI we set REUSE_SERVER=1 to skip this (the workflow boots them explicitly).
  webServer: process.env.REUSE_SERVER
    ? undefined
    : [
        {
          command:
            'cd ../backend && RAILS_ENV=test bin/rails db:test:prepare && RAILS_ENV=test bin/rails db:seed && RAILS_ENV=test bin/rails server -p 3000',
          port: 3000,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'npm start',
          port: 4200,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
