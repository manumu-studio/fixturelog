// VesselModal.test.tsx — proves the vessel detail modal renders specs and links
// into the Create Enquiry prefill route.
import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/components/portal/Modal', () => {
  function Modal({
    open,
    children,
    labelledBy,
  }: {
    open: boolean;
    children: ReactNode;
    labelledBy?: string;
  }) {
    return open ? <section role="dialog" aria-labelledby={labelledBy}>{children}</section> : null;
  }
  return { Modal };
});

vi.mock('@/components/portal/Lightbox', () => {
  function Lightbox({ images, alt }: { images: string[]; alt: string }) {
    return <div data-testid="lightbox" data-alt={alt}>{images.join('|')}</div>;
  }
  return { Lightbox };
});

vi.mock('@/components/portal/StatusBadge', () => {
  function StatusBadge({ status }: { status: string }) {
    return <span data-testid="status">{status}</span>;
  }
  return { StatusBadge };
});

vi.mock('next/link', () => {
  function MockLink({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
    return <a href={href} {...rest}>{children}</a>;
  }
  return { default: MockLink };
});

import { VesselModal } from './VesselModal';
import { BRAND_DEMO_FLEET } from '@/lib/constants/brand';
import type { FleetVessel } from '@/lib/validators/portal.validators';

const VESSEL = {
  id: 'vessel-ahts-1',
  name: 'Highland Handler',
  vesselType: 'AHTS',
  status: 'OPEN',
  dpClass: 'DP2',
  deckAreaM2: 760,
  bollardPullT: 205,
  builtYear: 2020,
  ownerName: BRAND_DEMO_FLEET,
  regionName: 'North Sea',
  regionCode: 'NORTH_SEA',
  openPort: 'Stavanger',
  lat: 58.97,
  lng: 5.73,
  portName: 'Stavanger',
  positionSource: 'SEEDED',
  positionConfidence: 'HIGH',
  imageUrl: '/assets/vessels/ahts.svg',
  images: ['/assets/vessels/ahts.svg', '/assets/vessels/psv.svg'],
  imageSource: 'seeded',
  imageCredit: 'Demo vessel illustration',
  rate: { min: 92000, median: 108000, max: 122000 },
} satisfies FleetVessel;

describe('VesselModal', () => {
  it('renders vessel details, image credit, and the prefilled enquiry CTA', () => {
    const html = renderToStaticMarkup(
      <VesselModal vessel={VESSEL} onClose={vi.fn()} canCreateEnquiry />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('Highland Handler');
    expect(html).toContain(`AHTS · ${BRAND_DEMO_FLEET} · North Sea`);
    expect(html).toContain('205 t');
    expect(html).toContain('Demo vessel illustration');
    expect(html).toContain('Use in enquiry');
    expect(html).toContain('href="/portal/enquiries/new?vesselType=AHTS&amp;regionCode=NORTH_SEA"');
  });

  it('hides the prefilled enquiry CTA when the actor cannot create enquiries', () => {
    const html = renderToStaticMarkup(
      <VesselModal vessel={VESSEL} onClose={vi.fn()} canCreateEnquiry={false} />,
    );

    expect(html).toContain('Highland Handler');
    expect(html).not.toContain('Use in enquiry');
    expect(html).not.toContain('/portal/enquiries/new');
  });

  it('renders nothing when no vessel is selected', () => {
    const html = renderToStaticMarkup(
      <VesselModal vessel={null} onClose={vi.fn()} canCreateEnquiry />,
    );

    expect(html).toBe('');
  });
});
