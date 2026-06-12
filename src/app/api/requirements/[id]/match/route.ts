// POST /api/requirements/:id/match — fetch candidates + benchmarks, run FixtureMatcher, conditionally transition ENQUIRY → SHORTLISTED
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { MatchRequestSchema } from '@/lib/validators/requirement.validators';
import { match } from '@/lib/services/fixture-matcher';
import { DEFAULT_WEIGHTS } from '@/lib/services/fixture-matcher.types';
import type { MatchCandidate, MatchRequirement, MatchBenchmark } from '@/lib/services/fixture-matcher.types';
import type { RequirementStatus, VesselStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type VesselRow = {
  id: string;
  name: string;
  vesselType: import('@prisma/client').VesselType;
  status: VesselStatus;
  dpClass: import('@prisma/client').DPClass;
  deckAreaM2: number | null | undefined;
  bollardPullT: number | null | undefined;
  openDate: Date | null | undefined;
  openRegionId: string | null | undefined;
  positions: { lat: number; lng: number; capturedAt: Date }[];
};

function buildCandidate(vessel: VesselRow): MatchCandidate {
  const latest = vessel.positions[0];
  return {
    id: vessel.id,
    name: vessel.name,
    vesselType: vessel.vesselType,
    status: vessel.status,
    dpClass: vessel.dpClass,
    deckAreaM2: vessel.deckAreaM2 ?? null,
    bollardPullT: vessel.bollardPullT ?? null,
    openDate: vessel.openDate ?? null,
    openRegionId: vessel.openRegionId ?? null,
    positionLat: latest?.lat ?? null,
    positionLng: latest?.lng ?? null,
  };
}

type RequirementWithRegion = {
  vesselTypeNeeded: import('@prisma/client').VesselType;
  regionId: string;
  minDeckAreaM2: number | null | undefined;
  minBollardPullT: number | null | undefined;
  minDpClass: import('@prisma/client').DPClass | null | undefined;
  startDate: Date;
  dayRateBudget: number | null | undefined;
  region: { centerLat: number; centerLng: number };
};

function toMatchRequirement(req: RequirementWithRegion): MatchRequirement {
  return {
    vesselTypeNeeded: req.vesselTypeNeeded,
    regionId: req.regionId,
    regionCenterLat: req.region.centerLat,
    regionCenterLng: req.region.centerLng,
    minDeckAreaM2: req.minDeckAreaM2 ?? null,
    minBollardPullT: req.minBollardPullT ?? null,
    minDpClass: req.minDpClass ?? null,
    startDate: req.startDate,
    dayRateBudget: req.dayRateBudget ?? null,
  };
}

type BenchmarkRow = {
  vesselType: import('@prisma/client').VesselType;
  regionId: string;
  minRate: number;
  medianRate: number;
  maxRate: number;
};

function toBenchmark(b: BenchmarkRow): MatchBenchmark {
  return {
    vesselType: b.vesselType,
    regionId: b.regionId,
    minRate: b.minRate,
    medianRate: b.medianRate,
    maxRate: b.maxRate,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Validate route param
  const { id } = await params;
  const paramParsed = CuidParamSchema.safeParse({ id });
  if (!paramParsed.success) {
    return NextResponse.json(
      { error: 'Invalid requirement ID', details: paramParsed.error.issues },
      { status: 400 },
    );
  }

  // 2. Parse optional request body
  const rawBody: unknown = request.headers.get('content-type')?.includes('application/json')
    ? await request.json().catch(() => undefined)
    : undefined;

  const bodyParsed = MatchRequestSchema.safeParse(rawBody);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: bodyParsed.error.issues },
      { status: 400 },
    );
  }
  const body = bodyParsed.data;

  // 3. Fetch requirement with region
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: { region: true },
  });

  if (!requirement) {
    return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
  }

  // 4. Build MatchRequirement
  const matchRequirement = toMatchRequirement(requirement);

  // 5. Fetch all candidate vessels with latest position
  const vessels = await prisma.vessel.findMany({
    include: {
      positions: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });

  // 6. Map to MatchCandidate[]
  const candidates: MatchCandidate[] = vessels.map(buildCandidate);

  // 7. Fetch rate benchmarks
  const rawBenchmarks = await prisma.rateBenchmark.findMany({
    where: { regionId: requirement.regionId, vesselType: requirement.vesselTypeNeeded },
  });
  const benchmarks: MatchBenchmark[] = rawBenchmarks.map(toBenchmark);

  // 8. Run matcher
  const results = match(matchRequirement, candidates, benchmarks, body?.weights);

  // 9. Determine post-operation status — only ENQUIRY promotes to SHORTLISTED
  const currentStatus: RequirementStatus = requirement.status;
  let finalStatus: RequirementStatus = currentStatus;

  if (currentStatus === 'ENQUIRY') {
    await prisma.requirement.update({
      where: { id },
      data: { status: 'SHORTLISTED' },
    });
    finalStatus = 'SHORTLISTED';
  }
  // Any other status (SHORTLISTED, NEGOTIATING, ON_SUBS, FIXED, LOST):
  // re-match runs but status is unchanged; finalStatus remains currentStatus

  // 10. Return response
  return NextResponse.json({
    data: {
      requirementId: id,
      status: finalStatus,
      totalCandidates: candidates.length,
      passedFilters: results.length,
      results,
      weightsUsed: body?.weights ?? DEFAULT_WEIGHTS,
    },
  });
}
