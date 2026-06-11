// playwright.config.ts — E2E test configuration (SPEC-001 §7)
import { defineConfig, devices } from '@playwright/test';

const IS_CI = Boolean(process.env.CI);
const E2E_PORT = process.env.PLAYWRIGHT_PORT ?? (IS_CI ? '3000' : '3100');
const E2E_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${E2E_PORT}`;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  timeout: IS_CI ? 30_000 : 120_000,
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: 1,
  reporter: IS_CI ? 'github' : 'html',
  expect: {
    timeout: IS_CI ? 5_000 : 45_000,
  },
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev:e2e -- --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: IS_CI ? 120_000 : 180_000,
  },
});
