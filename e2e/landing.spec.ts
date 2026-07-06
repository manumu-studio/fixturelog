// e2e/landing.spec.ts - public product landing checks.
import { expect, test } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'assets', 'landing');

test('desktop (1440): public product landing shows the workflow story', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  await expect(page.getByText('ManuMu Offshore').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /From enquiry to recap/i })).toBeVisible();
  await expect(page.getByText(/seeded North Sea fleet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Key metrics/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /What ManuMu Offshore models/i })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeAttached();
  await expect(page.getByRole('link', { name: /Regional Map/i }).first()).toBeVisible();
  await expect(page.locator('a[href="/requirements"]').first()).toBeVisible();
  await expect(page.locator('a[href="/charterers/new"]').first()).toBeVisible();
  await expect(page.locator('a[href="/api/health"]').first()).toBeVisible();
  await expect(page.getByText('Private build in progress')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Assistant previews/i })).toHaveCount(0);
  expect(consoleErrors).toHaveLength(0);

  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.waitForTimeout(1_200);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'landing-desktop-1440.png'),
    fullPage: false,
  });
});

test('mobile (390): public product landing keeps the workflow story readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /From enquiry to recap/i })).toBeVisible();
  await expect(page.getByText(/seeded North Sea fleet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Key metrics/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /What ManuMu Offshore models/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Regional Map/i }).first()).toBeVisible();
  await expect(page.getByText('Private build in progress')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Assistant previews/i })).toHaveCount(0);

  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await page.waitForTimeout(1_200);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'landing-mobile-390.png'),
    fullPage: false,
  });
});

test('GET /api/health returns 200 with { status: "ok" }', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok' });
});
