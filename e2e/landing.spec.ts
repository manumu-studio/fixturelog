// e2e/landing.spec.ts - public locked build landing checks.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'assets', 'landing');

async function openAssistantDetails(page: Page) {
  await page.locator('summary').filter({ hasText: 'Assistant previews' }).click();
}

async function selectStatusButton(page: Page, name: RegExp) {
  const button = page.getByRole('button', { name });
  await button.focus();
  await page.keyboard.press('Enter');
}

test('desktop (1440): locked build page shows silent status panel and no product links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  await expect(page.getByText('ManuMu Offshore').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Two junior assistants are being built/i })).toBeVisible();
  await expect(page.getByText('Private build in progress')).toBeVisible();
  await expect(page.getByText('Build status')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Assistant previews/i })).toBeVisible();
  await expect(page.locator('canvas').nth(1)).toBeAttached();
  await openAssistantDetails(page);
  await expect(page.getByText(/FixtureLog is building two junior assistants/i)).toBeVisible();
  await selectStatusButton(page, /Matching assistant/i);
  await expect(page.getByText(/shortlist rationale/i)).toBeVisible();
  await selectStatusButton(page, /Public access/i);
  await expect(page.getByText(/public page stays closed/i)).toBeVisible();
  await selectStatusButton(page, /Chartering assistant/i);
  await expect(page.getByText(/broker-charterer intake/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'What is being built?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Matching', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Play briefing/i })).toHaveCount(0);

  await expect(page.getByRole('link', { name: /Go to Workspace/i })).toHaveCount(0);
  await expect(page.locator('a[href="/dashboard"]')).toHaveCount(0);
  await expect(page.locator('a[href="/portal"]')).toHaveCount(0);
  await expect(page.locator('a[href="/requirements"]')).toHaveCount(0);
  await expect(page.locator('a[href="/charterers"]')).toHaveCount(0);
  await expect(page.locator('a[href="/map"]')).toHaveCount(0);
  await expect(page.locator('text=Voice briefing')).toHaveCount(0);
  expect(consoleErrors).toHaveLength(0);

  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.waitForTimeout(1_200);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'landing-desktop-1440.png'),
    fullPage: false,
  });
});

test('mobile (390): locked build page keeps the message readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Two junior assistants are being built/i })).toBeVisible();
  await expect(page.getByText('The desk stays private while the service takes shape.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Assistant previews/i })).toBeVisible();
  await openAssistantDetails(page);
  await selectStatusButton(page, /Matching assistant/i);
  await expect(page.getByText(/shortlist rationale/i)).toBeVisible();
  await selectStatusButton(page, /Chartering assistant/i);
  await expect(page.getByText(/broker-charterer intake/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Play briefing/i })).toHaveCount(0);

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
