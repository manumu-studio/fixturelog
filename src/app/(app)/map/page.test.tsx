// page.test.tsx — proves /map is the canonical available-vessels screen and hosts
// the Fleet Explorer rather than the old marker-only map shell.
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FleetVessel } from '@/lib/validators/portal.validators';
import { BRAND_DEMO_FLEET, BRAND_NAME } from '@/lib/constants/brand';

vi.mock('@/lib/services/portal/portal-fleet', () => ({ getFleet: vi.fn() }));
vi.mock('@/lib/auth/require-session', () => ({ requireSession: vi.fn() }));
vi.mock('@/lib/auth/resolve-home-route', () => ({ resolveHomeRoute: vi.fn() }));
vi.mock('@/features/fleet-explorer/FleetExplorer', () => {
  function FleetExplorer({
    vessels,
    canCreateEnquiry,
  }: {
    vessels: FleetVessel[];
    canCreateEnquiry: boolean;
  }) {
    return (
      <section
        data-testid="fleet-explorer"
        data-count={vessels.length}
        data-can-create-enquiry={canCreateEnquiry}
      />
    );
  }
  return { FleetExplorer };
});

import MapPage, { metadata } from './page';
import { getFleet } from '@/lib/services/portal/portal-fleet';
import { requireSession } from '@/lib/auth/require-session';
import { resolveHomeRoute } from '@/lib/auth/resolve-home-route';

const VESSELS = [
  {
    id: 'vessel-psv-1',
    name: 'North Sea Provider',
    vesselType: 'PSV',
    status: 'OPEN',
    dpClass: 'DP2',
    deckAreaM2: 920,
    bollardPullT: null,
    builtYear: 2018,
    ownerName: BRAND_DEMO_FLEET,
    regionName: 'North Sea',
    regionCode: 'NORTH_SEA',
    openPort: 'Aberdeen',
    lat: 57.1497,
    lng: -2.0943,
    portName: 'Aberdeen',
    positionSource: 'SEEDED',
    positionConfidence: 'HIGH',
    imageUrl: '/assets/vessels/psv.svg',
    images: ['/assets/vessels/psv.svg'],
    imageSource: 'seeded',
    imageCredit: 'Demo vessel illustration',
    rate: { min: 72000, median: 82000, max: 94000 },
  },
] satisfies FleetVessel[];

describe('/map available vessels page', () => {
  beforeEach(() => {
    vi.mocked(requireSession).mockResolvedValue({
      externalId: 'broker-user',
      email: 'broker@example.com',
      name: 'Broker',
    });
    vi.mocked(resolveHomeRoute).mockResolvedValue('/dashboard');
  });

  it('renders the Fleet Explorer with server-fetched vessels', async () => {
    vi.mocked(getFleet).mockResolvedValue(VESSELS);

    const html = renderToStaticMarkup(await MapPage());

    expect(html).toContain('Available vessels');
    expect(html).toContain('Regional Map');
    expect(html).toContain('data-testid="fleet-explorer"');
    expect(html).toContain('data-count="1"');
  });

  it('disables the enquiry action for broker sessions', async () => {
    vi.mocked(getFleet).mockResolvedValue(VESSELS);
    vi.mocked(resolveHomeRoute).mockResolvedValue('/dashboard');

    const html = renderToStaticMarkup(await MapPage());

    expect(html).toContain('data-can-create-enquiry="false"');
    expect(html).not.toContain('enquiry prefill');
  });

  it('enables the enquiry action for client sessions', async () => {
    vi.mocked(getFleet).mockResolvedValue(VESSELS);
    vi.mocked(resolveHomeRoute).mockResolvedValue('/portal');

    const html = renderToStaticMarkup(await MapPage());

    expect(html).toContain('data-can-create-enquiry="true"');
    expect(html).toContain('enquiry prefill');
  });

  it('uses available-vessel metadata', () => {
    expect(metadata.title).toBe(`Available Vessels — ${BRAND_NAME}`);
  });
});
