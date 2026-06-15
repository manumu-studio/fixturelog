// portal-fleet.test.ts — verifies Fleet Explorer ordering before `/map` renders.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    vessel: { findMany: vi.fn() },
    rateBenchmark: { findMany: vi.fn() },
  },
}));

import { getFleet } from './portal-fleet';
import { prisma } from '@/lib/prisma';

function vessel(name: string, imageSource: string, imageUrl: string | null) {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    vesselType: 'PSV',
    status: 'OPEN',
    dpClass: 'DP2',
    deckAreaM2: 900,
    bollardPullT: null,
    builtYear: 2018,
    owner: { name: 'Demo Owner' },
    openRegion: { name: 'North Sea', code: 'NORTH_SEA' },
    openRegionId: 'region-1',
    openPort: 'Aberdeen',
    positions: [],
    imageUrl,
    images: imageUrl === null ? [] : [imageUrl],
    imageSource,
    imageCredit: imageUrl === null ? null : 'Demo credit',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.rateBenchmark.findMany).mockResolvedValue([]);
});

describe('getFleet', () => {
  it('places vessels without real pictures at the end of the map fleet', async () => {
    vi.mocked(prisma.vessel.findMany).mockResolvedValue([
      vessel('Alpha Stock Art', 'STOCK', '/assets/vessels/psv.svg'),
      vessel('Bravo No Image', 'STOCK', null),
      vessel('Zulu Real Photo', 'WIKIMEDIA', '/assets/vessels/real/zulu-real-photo.jpg'),
    ] as never);

    const fleet = await getFleet();

    expect(fleet.map((v) => v.name)).toEqual([
      'Zulu Real Photo',
      'Alpha Stock Art',
      'Bravo No Image',
    ]);
  });
});
