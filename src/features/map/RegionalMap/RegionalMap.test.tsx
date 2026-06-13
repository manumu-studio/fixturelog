// Render tests for RegionalMap (react-leaflet mocked inline; renderToStaticMarkup — no jsdom)
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div data-map="">{children}</div>,
  TileLayer: () => <div data-tile="" />,
  CircleMarker: ({ children }: { children?: ReactNode }) => <span className="vessel-marker">{children}</span>,
  Popup: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

import { RegionalMap } from './RegionalMap';
import type { MapVesselPosition } from './RegionalMap.types';

const vessel = (id: string, name: string): MapVesselPosition => ({
  id, name, vesselType: 'PSV', status: 'OPEN', ownerName: 'Owner',
  lat: 57.1, lng: 1.8, portName: null, source: 'SEEDED', confidence: 'HIGH',
});

const markerCount = (html: string): number => html.split('vessel-marker').length - 1;

describe('RegionalMap', () => {
  it('mounts and renders the map container', () => {
    const html = renderToStaticMarkup(<RegionalMap vessels={[vessel('a', 'Nordic Hawk')]} />);
    expect(html).toContain('data-map');
  });

  it('renders one marker per vessel', () => {
    const html = renderToStaticMarkup(
      <RegionalMap vessels={[vessel('a', 'Nordic Hawk'), vessel('b', 'Atlantic Pioneer'), vessel('c', 'Sea Falcon')]} />,
    );
    expect(markerCount(html)).toBe(3);
    expect(html).toContain('Nordic Hawk');
    expect(html).toContain('Atlantic Pioneer');
  });
});
