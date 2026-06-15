// portal-fleet.ts — whole-fleet read for the portal Fleet Explorer (PACKET-009 §T10).
// The fleet is visible to any charterer (not scoped), but the portal never writes to it.
// Reads run server-side, so no broker-gated /api/vessels endpoint is involved.
import 'server-only';
import type { ConfidenceLevel, PositionSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { FleetVessel } from '@/lib/validators/portal.validators';

interface PositionLike {
  lat: number;
  lng: number;
  portName: string | null;
  source: PositionSource;
  confidence: ConfidenceLevel;
}

interface BenchLike {
  minRate: number;
  medianRate: number;
  maxRate: number;
}

const REAL_IMAGE_SOURCES = new Set(['OPERATOR', 'WIKIMEDIA', 'EXTERNAL']);

function positionFields(pos: PositionLike | undefined) {
  return {
    lat: pos?.lat ?? null,
    lng: pos?.lng ?? null,
    portName: pos?.portName ?? null,
    positionSource: pos?.source ?? 'SEEDED',
    positionConfidence: pos?.confidence ?? 'LOW',
  };
}

function rateFields(bench: BenchLike | undefined): FleetVessel['rate'] {
  return bench === undefined
    ? null
    : { min: bench.minRate, median: bench.medianRate, max: bench.maxRate };
}

function hasRealVesselPicture(vessel: FleetVessel): boolean {
  const hasImage = vessel.imageUrl !== null && vessel.imageUrl.trim().length > 0;
  return hasImage && REAL_IMAGE_SOURCES.has(vessel.imageSource.toUpperCase());
}

function sortFleetForMap(vessels: FleetVessel[]): FleetVessel[] {
  return [...vessels].sort((a, b) => {
    const imageRank = Number(hasRealVesselPicture(b)) - Number(hasRealVesselPicture(a));
    return imageRank !== 0 ? imageRank : a.name.localeCompare(b.name);
  });
}

export async function getFleet(): Promise<FleetVessel[]> {
  const [vessels, benchmarks] = await Promise.all([
    prisma.vessel.findMany({
      include: {
        owner: { select: { name: true } },
        openRegion: { select: { name: true, code: true } },
        positions: { orderBy: { capturedAt: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.rateBenchmark.findMany(),
  ]);

  const benchByKey = new Map(benchmarks.map((b) => [`${b.regionId}:${b.vesselType}`, b]));

  const fleet = vessels.map((v) => {
    const bench =
      v.openRegionId !== null ? benchByKey.get(`${v.openRegionId}:${v.vesselType}`) : undefined;
    return {
      id: v.id,
      name: v.name,
      vesselType: v.vesselType,
      status: v.status,
      dpClass: v.dpClass,
      deckAreaM2: v.deckAreaM2,
      bollardPullT: v.bollardPullT,
      builtYear: v.builtYear,
      ownerName: v.owner.name,
      regionName: v.openRegion?.name ?? null,
      regionCode: v.openRegion?.code ?? null,
      openPort: v.openPort,
      ...positionFields(v.positions[0]),
      imageUrl: v.imageUrl,
      images: v.images,
      imageSource: v.imageSource,
      imageCredit: v.imageCredit,
      rate: rateFields(bench),
    };
  });

  return sortFleetForMap(fleet);
}
