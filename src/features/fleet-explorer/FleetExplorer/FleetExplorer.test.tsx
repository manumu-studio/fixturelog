// FleetExplorer.test.tsx — locks the orchestration contract: map markers and
// gallery cards receive the same select callback, so both open the same modal.
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FleetVessel } from '@/lib/validators/portal.validators';
import { BRAND_DEMO_FLEET } from '@/lib/constants/brand';
import type { MapVesselPosition } from '@/features/map/RegionalMap/RegionalMap.types';

const hooks = vi.hoisted(() => ({
  select: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('next/dynamic', () => {
  function MockRegionalMap({
    vessels,
    onVesselClick,
  }: {
    vessels: MapVesselPosition[];
    onVesselClick?: (vesselId: string) => void;
  }) {
    return (
      <div
        data-testid="regional-map"
        data-count={vessels.length}
        data-shares-select={onVesselClick === hooks.select}
      />
    );
  }
  return { default: () => MockRegionalMap };
});

vi.mock('@/features/fleet-explorer/VesselGallery', () => {
  function VesselGallery({
    vessels,
    onSelect,
  }: {
    vessels: FleetVessel[];
    onSelect: (vesselId: string) => void;
  }) {
    return (
      <div
        data-testid="vessel-gallery"
        data-count={vessels.length}
        data-shares-select={onSelect === hooks.select}
      />
    );
  }
  return { VesselGallery };
});

vi.mock('@/features/fleet-explorer/VesselModal', () => {
  function VesselModal({
    vessel,
    canCreateEnquiry,
  }: {
    vessel: FleetVessel | null;
    canCreateEnquiry: boolean;
  }) {
    return (
      <div
        data-testid="vessel-modal"
        data-selected={vessel?.id ?? 'none'}
        data-can-create-enquiry={canCreateEnquiry}
      />
    );
  }
  return { VesselModal };
});

vi.mock('@/features/fleet-explorer/useFleetExplorer', () => {
  function useFleetExplorer() {
    return {
      selected: null,
      positions: [
        {
          id: 'vessel-psv-1',
          name: 'North Sea Provider',
          vesselType: 'PSV',
          status: 'OPEN',
          ownerName: BRAND_DEMO_FLEET,
          lat: 57.1497,
          lng: -2.0943,
          portName: 'Aberdeen',
          source: 'SEEDED',
          confidence: 'HIGH',
        },
      ],
      select: hooks.select,
      clear: hooks.clear,
    };
  }
  return { useFleetExplorer };
});

import { FleetExplorer } from './FleetExplorer';

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

describe('FleetExplorer', () => {
  it('wires map markers and gallery cards to the same modal selection callback', () => {
    const html = renderToStaticMarkup(<FleetExplorer vessels={VESSELS} canCreateEnquiry />);

    expect(html).toContain('data-testid="regional-map"');
    expect(html).toContain('data-testid="vessel-gallery"');
    expect(html).toContain('data-shares-select="true"');
    expect(html).toContain('data-selected="none"');
    expect(html).toContain('data-can-create-enquiry="true"');
  });

  it('passes the disabled enquiry action state to the vessel modal', () => {
    const html = renderToStaticMarkup(
      <FleetExplorer vessels={VESSELS} canCreateEnquiry={false} />,
    );

    expect(html).toContain('data-can-create-enquiry="false"');
  });
});
