// portal-shortlist.ts — recommended-vessel shortlist for a charterer's enquiry,
// reusing the broker FixtureMatcher read-only (no status mutation).
import 'server-only';
import { prisma } from '@/lib/prisma';
import { match } from '@/lib/services/fixture-matcher';
import type {
  MatchBenchmark, MatchCandidate, MatchRequirement,
} from '@/lib/services/fixture-matcher.types';
import { toShortlistEntry, type ShortlistVesselRow } from './portal-mappers';
import type { ShortlistEntry } from '@/lib/validators/portal.validators';

const SHORTLIST_SIZE = 5;

interface RequirementForMatch {
  vesselTypeNeeded: MatchRequirement['vesselTypeNeeded'];
  regionId: string;
  minDeckAreaM2: number | null;
  minBollardPullT: number | null;
  minDpClass: MatchRequirement['minDpClass'];
  startDate: Date;
  dayRateBudget: number | null;
  region: { centerLat: number; centerLng: number };
}

export async function computeShortlist(req: RequirementForMatch): Promise<ShortlistEntry[]> {
  const vessels = await prisma.vessel.findMany({
    include: { positions: { orderBy: { capturedAt: 'desc' }, take: 1 } },
  });

  const candidates: MatchCandidate[] = vessels.map((v) => {
    const latest = v.positions[0];
    return {
      id: v.id,
      name: v.name,
      vesselType: v.vesselType,
      status: v.status,
      dpClass: v.dpClass,
      deckAreaM2: v.deckAreaM2,
      bollardPullT: v.bollardPullT,
      openDate: v.openDate,
      openRegionId: v.openRegionId,
      positionLat: latest?.lat ?? null,
      positionLng: latest?.lng ?? null,
    };
  });

  const benchmarks: MatchBenchmark[] = (
    await prisma.rateBenchmark.findMany({
      where: { regionId: req.regionId, vesselType: req.vesselTypeNeeded },
    })
  ).map((b) => ({
    vesselType: b.vesselType,
    regionId: b.regionId,
    minRate: b.minRate,
    medianRate: b.medianRate,
    maxRate: b.maxRate,
  }));

  const matchRequirement: MatchRequirement = {
    vesselTypeNeeded: req.vesselTypeNeeded,
    regionId: req.regionId,
    regionCenterLat: req.region.centerLat,
    regionCenterLng: req.region.centerLng,
    minDeckAreaM2: req.minDeckAreaM2,
    minBollardPullT: req.minBollardPullT,
    minDpClass: req.minDpClass,
    startDate: req.startDate,
    dayRateBudget: req.dayRateBudget,
  };

  const results = match(matchRequirement, candidates, benchmarks).slice(0, SHORTLIST_SIZE);
  const vesselById = new Map<string, ShortlistVesselRow>(
    vessels.map((v) => [v.id, v]),
  );

  return results
    .map((r) => {
      const vessel = vesselById.get(r.vesselId);
      return vessel === undefined ? null : toShortlistEntry(r, vessel);
    })
    .filter((entry): entry is ShortlistEntry => entry !== null);
}
