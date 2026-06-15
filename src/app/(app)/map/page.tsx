// /map — available vessels page: existing FixtureLog Leaflet map plus the vessel
// gallery/modal Fleet Explorer. This is the canonical fleet-availability surface.

import type { Metadata } from 'next';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { FleetExplorer } from '@/features/fleet-explorer/FleetExplorer';
import { BRAND_NAME } from '@/lib/constants/brand';
import { requireSession } from '@/lib/auth/require-session';
import { resolveHomeRoute } from '@/lib/auth/resolve-home-route';
import { getFleet } from '@/lib/services/portal/portal-fleet';

export const metadata: Metadata = {
  title: `Available Vessels — ${BRAND_NAME}`,
  description: 'Available offshore vessels shown on the regional map and gallery.',
};

export default async function MapPage() {
  const user = await requireSession();
  const [vessels, homeRoute] = await Promise.all([getFleet(), resolveHomeRoute(user)]);
  const canCreateEnquiry = homeRoute === '/portal';
  const subline = canCreateEnquiry
    ? 'Browse the available fleet on the map or in the vessel gallery. Open a vessel for specs, images, rate context, and enquiry prefill.'
    : 'Browse the available fleet on the map or in the vessel gallery. Open a vessel for specs, images, and rate context.';

  return (
    <>
      <PortalPageHeader
        eyebrow="Available vessels"
        title="Regional Map"
        subline={subline}
      />
      <FleetExplorer vessels={vessels} canCreateEnquiry={canCreateEnquiry} />
    </>
  );
}
