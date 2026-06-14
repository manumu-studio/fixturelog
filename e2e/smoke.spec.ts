// e2e/smoke.spec.ts — Smoke tests for the spine foundation.
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  // The public landing identifies the app via the nav brand; the <h1> is the hero headline.
  await expect(page.getByRole('link', { name: 'FixtureLog' }).first()).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});
