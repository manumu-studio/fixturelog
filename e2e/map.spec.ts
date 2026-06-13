// E2E: /map renders the Leaflet map with vessel markers (OSM tiles aborted — hermetic)
import { test, expect } from '@playwright/test';

test('regional map renders vessel markers without live tiles', async ({ page }) => {
  // Hermetic: never hit the live OSM tile servers.
  await page.route('**/tile.openstreetmap.org/**', (route) => route.abort());

  await page.goto('/map');

  // The Leaflet container appears once the ssr:false dynamic chunk loads + initializes.
  const mapContainer = page.locator('.leaflet-container');
  await expect(mapContainer).toBeVisible({ timeout: 15_000 });

  // CircleMarkers render as interactive SVG <path> elements inside the map overlay pane.
  const markers = page.locator('.leaflet-container path.leaflet-interactive');
  await expect(markers.first()).toBeVisible({ timeout: 15_000 });
  expect(await markers.count()).toBeGreaterThan(0);
});
