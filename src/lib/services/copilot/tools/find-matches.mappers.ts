// find-matches.mappers.ts — pure Prisma-row → matcher-input mappers shared by the findMatches
// tool. Mirrors the same mapping the POST /api/requirements/:id/match route performs, kept in
// one place so the tool stays a thin wrapper and the scoring engine (fixture-matcher) is reused
// rather than re-implemented. No DB access, no I/O.
import type { DPClass, VesselType } from '@prisma/client';
import type {
  MatchBenchmark,
  MatchCandidate,
  MatchRequirement,
} from '@/lib/services/fixture-matcher.types';

export type RequirementWithRegion = {
  vesselTypeNeeded: VesselType;
  regionId: string;
  minDeckAreaM2: number | null;
  minBollardPullT: number | null;
  minDpClass: DPClass | null;
  startDate: Date;
  dayRateBudget: number | null;
  region: { centerLat: number; centerLng: number };
};

export function toMatchRequirement(req: RequirementWithRegion): MatchRequirement {
  return {
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
}

export type VesselWithPosition = {
  id: string;
  name: string;
  vesselType: VesselType;
  status: 'OPEN' | 'ON_HIRE' | 'YARD' | 'LAID_UP';
  dpClass: DPClass;
  deckAreaM2: number | null;
  bollardPullT: number | null;
  openDate: Date | null;
  openRegionId: string | null;
  positions: { lat: number; lng: number }[];
};

export function toMatchCandidate(vessel: VesselWithPosition): MatchCandidate {
  const latest = vessel.positions[0];
  return {
    id: vessel.id,
    name: vessel.name,
    vesselType: vessel.vesselType,
    status: vessel.status,
    dpClass: vessel.dpClass,
    deckAreaM2: vessel.deckAreaM2,
    bollardPullT: vessel.bollardPullT,
    openDate: vessel.openDate,
    openRegionId: vessel.openRegionId,
    positionLat: latest?.lat ?? null,
    positionLng: latest?.lng ?? null,
  };
}

export type BenchmarkRow = {
  vesselType: VesselType;
  regionId: string;
  minRate: number;
  medianRate: number;
  maxRate: number;
};

export function toMatchBenchmark(b: BenchmarkRow): MatchBenchmark {
  return {
    vesselType: b.vesselType,
    regionId: b.regionId,
    minRate: b.minRate,
    medianRate: b.medianRate,
    maxRate: b.maxRate,
  };
}
