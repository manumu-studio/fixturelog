// e2e/landing.spec.ts — Landing page E2E tests (PACKET-007 TASK-067).
// Verifies the public `/` route: hero, canvas, CTAs, health endpoint, mobile nav, no console errors.

import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'assets', 'landing');

// ---------------------------------------------------------------------------
// Desktop — 1440 × 900
// ---------------------------------------------------------------------------

test('desktop (1440): landing page loads with hero, canvas, CTAs and no console errors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  // Brand name is visible on the page (nav link + subline text)
  await expect(page.getByText('ManuMu Offshore Partners').first()).toBeVisible({ timeout: 15_000 });

  // Hero h1 is the workflow headline
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  await expect(h1).toContainText('broker');

  // E2E runs with the auth bypass, so the landing shows the authenticated workspace CTA.
  const workspaceCta = page.getByRole('link', { name: /Go to Workspace/i }).first();
  await expect(workspaceCta).toBeVisible();

  // The old disabled "Sign in coming next" teaser has been removed.
  await expect(page.getByText(/coming next/i)).toHaveCount(0);

  // Canvas is present and has drawn non-transparent pixels
  const canvas = page.locator('[data-testid="marine-canvas"]');
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  // Wait one rAF cycle for the canvas animation loop to paint
  await page.waitForTimeout(200);

  const hasPixels = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    // Count non-transparent pixels (alpha > 0)
    let visiblePixels = 0;
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 0) > 0) visiblePixels++;
    }
    return visiblePixels > 50;
  });
  expect(hasPixels).toBe(true);

  // Authenticated workspace CTA routes by role via the post-login hop (broker -> /dashboard,
  // charterer -> /portal). The E2E user resolves to an authenticated home, not the landing.
  await workspaceCta.click();
  await expect(page).toHaveURL(/\/(dashboard|portal)/);
  await page.goBack();

  // No console errors on the landing page load
  expect(consoleErrors).toHaveLength(0);

  // Scroll to top then wait for hero headline to finish fading in before screenshot
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await page.waitForFunction(
    () => {
      const h = document.querySelector('h1');
      return !!h && parseFloat(getComputedStyle(h).opacity) >= 0.99;
    },
    { timeout: 6000 },
  );
  // Settle remaining staggered items (subline, CTAs)
  await page.waitForTimeout(600);
  // Scroll h1 into view to ensure it is within the screenshot viewport
  await page.locator('h1').first().scrollIntoViewIfNeeded();

  // Desktop screenshot — hero headline + CTAs fully visible
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'landing-desktop-1440.png'),
    fullPage: false,
  });
});

// ---------------------------------------------------------------------------
// Mobile — 390 × 844 (iPhone 14 viewport)
// ---------------------------------------------------------------------------

test('mobile (390): heading visible, workspace CTA clickable and routes to the role home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  // Heading is visible at mobile width
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible({ timeout: 15_000 });

  // Open mobile hamburger menu so nav links are accessible
  const menuToggle = page.getByRole('button', { name: /open navigation menu/i });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
  }

  // Authenticated workspace CTA (E2E bypass). Target the hero instance (last in DOM;
  // nav renders first) so it is visible at mobile width without depending on the menu.
  const workspaceCta = page.getByRole('link', { name: /Go to Workspace/i }).last();
  await expect(workspaceCta).toBeVisible({ timeout: 10_000 });
  await workspaceCta.click();
  await expect(page).toHaveURL(/\/(dashboard|portal)/);

  // Mobile screenshot — scroll to top, wait for hero headline to finish fading in before capturing
  await page.goBack();
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await page.waitForFunction(
    () => {
      const h = document.querySelector('h1');
      return !!h && parseFloat(getComputedStyle(h).opacity) >= 0.99;
    },
    { timeout: 6000 },
  );
  // Settle remaining staggered items (subline, CTAs)
  await page.waitForTimeout(600);
  // Scroll h1 into view to ensure it is within the screenshot viewport
  await page.locator('h1').first().scrollIntoViewIfNeeded();

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'landing-mobile-390.png'),
    fullPage: false,
  });
});

// ---------------------------------------------------------------------------
// Health endpoint
// ---------------------------------------------------------------------------

test('GET /api/health returns 200 with { status: "ok" }', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json() as { status: string };
  expect(body.status).toBe('ok');
});
