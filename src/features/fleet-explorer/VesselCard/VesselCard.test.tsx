// VesselCard.test.tsx — proves the gallery card renders the vessel photo + bottom
// name/type label and stays clickable for the shared Fleet Explorer modal.
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/image', () => {
  function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  }
  return { default: MockImage };
});

import { VesselCard } from './VesselCard';
import { BRAND_DEMO_FLEET } from '@/lib/constants/brand';
import type { FleetVessel } from '@/lib/validators/portal.validators';

const BASE_VESSEL = {
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
} satisfies FleetVessel;

describe('VesselCard', () => {
  it('renders the vessel photo, name, type, and modal trigger label', () => {
    const html = renderToStaticMarkup(<VesselCard vessel={BASE_VESSEL} onSelect={vi.fn()} />);

    expect(html).toContain('North Sea Provider');
    expect(html).toContain('PSV');
    expect(html).toContain('src="/assets/vessels/psv.svg"');
    expect(html).toContain('aria-label="View North Sea Provider (PSV)"');
  });

  it('uses a labelled fallback image when a vessel has no imageUrl', () => {
    const vessel = { ...BASE_VESSEL, imageUrl: null, images: [] } satisfies FleetVessel;

    const html = renderToStaticMarkup(<VesselCard vessel={vessel} onSelect={vi.fn()} />);

    expect(html).toContain('src="/assets/vessels/generic.svg"');
    expect(html).toContain('alt="North Sea Provider"');
  });
});
