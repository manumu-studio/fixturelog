// e2e/smoke.spec.ts — Smoke tests for the spine foundation.
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('ManuMu Offshore').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /From enquiry to recap/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Key metrics/i })).toBeVisible();
});

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});
