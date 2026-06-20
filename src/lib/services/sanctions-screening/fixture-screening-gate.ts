// Fixture-level sanctions gate: re-screen parties before FIXED, persist immutable evidence,
// update provenance cache fields, and return a deterministic allow/block outcome.
import 'server-only';
import type { Prisma, ScreeningStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  evaluateScreeningGate,
  screenSubject,
} from './sanctions-screening';
import type {
  FixtureStatusForGate,
  ScreenableSubject,
  ScreeningGateOutcome,
  ScreeningResultSnapshot,
} from './sanctions-screening.types';

type ScreeningPersistenceClient = Pick<
  typeof prisma,
  'screeningResult' | 'vessel' | 'owner' | 'operator' | 'charterer'
>;

interface FixturePartyRow {
  id: string;
  status: FixtureStatusForGate;
  requirementId: string | null;
  vessel: {
    id: string;
    name: string;
    imo: string | null;
    mmsi: string | null;
    flagState: string | null;
    owner: { id: string; name: string; country: string | null };
    operator: { id: string; name: string; country: string | null } | null;
  };
  charterer: { id: string; name: string; sector: string | null };
}

interface ScreeningContext {
  fixtureId: string | null;
  requirementId: string | null;
  subjectId: string;
}

const FIXTURE_SCREENING_INCLUDE = {
  vessel: {
    select: {
      id: true,
      name: true,
      imo: true,
      mmsi: true,
      flagState: true,
      owner: { select: { id: true, name: true, country: true } },
      operator: { select: { id: true, name: true, country: true } },
    },
  },
  charterer: { select: { id: true, name: true, sector: true } },
} satisfies Prisma.FixtureInclude;

function subjectsForFixture(fixture: FixturePartyRow): ScreenableSubject[] {
  const subjects: ScreenableSubject[] = [
    {
      id: fixture.vessel.id,
      subjectType: 'VESSEL',
      name: fixture.vessel.name,
      imo: fixture.vessel.imo,
      mmsi: fixture.vessel.mmsi,
      flagState: fixture.vessel.flagState,
    },
    {
      id: fixture.vessel.owner.id,
      subjectType: 'OWNER',
      name: fixture.vessel.owner.name,
      country: fixture.vessel.owner.country,
    },
    {
      id: fixture.charterer.id,
      subjectType: 'CHARTERER',
      name: fixture.charterer.name,
      sector: fixture.charterer.sector,
    },
  ];
  if (fixture.vessel.operator !== null) {
    subjects.push({
      id: fixture.vessel.operator.id,
      subjectType: 'OPERATOR',
      name: fixture.vessel.operator.name,
      country: fixture.vessel.operator.country,
    });
  }
  return subjects;
}

function evidenceFor(result: ScreeningResultSnapshot): Prisma.InputJsonObject {
  return {
    subjectType: result.subjectType,
    subjectId: result.subjectId,
    subjectName: result.subjectName,
    status: result.status,
    reason: result.reason,
    sourceName: result.sourceName,
    sourceListName: result.sourceListName,
    sourceListVersion: result.sourceListVersion,
    screenedAt: result.screenedAt.toISOString(),
    ttlExpiresAt: result.ttlExpiresAt.toISOString(),
    matchedName: result.matchedName ?? null,
    matchedIdentifier: result.matchedIdentifier ?? null,
    matchType: result.matchType ?? null,
  };
}

function cacheData(
  resultId: string,
  result: ScreeningResultSnapshot,
): {
  latestScreeningStatus: ScreeningStatus;
  latestScreeningResultId: string;
  latestScreenedAt: Date;
  latestScreeningTtlExpiresAt: Date;
  latestScreeningSourceName: string;
  latestScreeningListName: string;
  latestScreeningListVersion: string;
  latestScreeningListDate: Date | null;
} {
  return {
    latestScreeningStatus: result.status,
    latestScreeningResultId: resultId,
    latestScreenedAt: result.screenedAt,
    latestScreeningTtlExpiresAt: result.ttlExpiresAt,
    latestScreeningSourceName: result.sourceName,
    latestScreeningListName: result.sourceListName,
    latestScreeningListVersion: result.sourceListVersion,
    latestScreeningListDate: result.sourceListDate ?? null,
  };
}

function createData(
  result: ScreeningResultSnapshot,
  context: ScreeningContext,
): Prisma.ScreeningResultUncheckedCreateInput {
  return {
    subjectType: result.subjectType,
    status: result.status,
    query: result.matchedIdentifier ?? result.subjectName,
    sourceName: result.sourceName,
    sourceJurisdiction: result.sourceJurisdiction ?? null,
    sourceListName: result.sourceListName,
    sourceListVersion: result.sourceListVersion,
    sourceListDate: result.sourceListDate ?? null,
    sourceRecordId: result.sourceRecordId ?? null,
    sourceRecordUrl: result.sourceRecordUrl ?? null,
    matchedName: result.matchedName ?? null,
    matchedIdentifier: result.matchedIdentifier ?? null,
    matchType: result.matchType ?? 'NONE',
    score: null,
    reason: result.reason,
    screenedAt: result.screenedAt,
    ttlExpiresAt: result.ttlExpiresAt,
    evidence: evidenceFor(result),
    fixtureId: context.fixtureId,
    requirementId: context.requirementId,
    ...(result.subjectType === 'VESSEL' ? { vesselId: context.subjectId } : {}),
    ...(result.subjectType === 'OWNER' ? { ownerId: context.subjectId } : {}),
    ...(result.subjectType === 'OPERATOR' ? { operatorId: context.subjectId } : {}),
    ...(result.subjectType === 'CHARTERER' ? { chartererId: context.subjectId } : {}),
  };
}

async function updateSubjectCache(
  tx: ScreeningPersistenceClient,
  result: ScreeningResultSnapshot,
  resultId: string,
  subjectId: string,
): Promise<void> {
  const data = cacheData(resultId, result);
  if (result.subjectType === 'VESSEL') {
    await tx.vessel.update({ where: { id: subjectId }, data });
    return;
  }
  if (result.subjectType === 'OWNER') {
    await tx.owner.update({ where: { id: subjectId }, data });
    return;
  }
  if (result.subjectType === 'OPERATOR') {
    await tx.operator.update({ where: { id: subjectId }, data });
    return;
  }
  await tx.charterer.update({ where: { id: subjectId }, data });
}

async function persistResult(
  tx: ScreeningPersistenceClient,
  result: ScreeningResultSnapshot,
  context: ScreeningContext,
): Promise<void> {
  const created = await tx.screeningResult.create({ data: createData(result, context) });
  await updateSubjectCache(tx, result, created.id, context.subjectId);
}

export function screenFixtureParties(
  fixture: FixturePartyRow,
  screenedAt: Date,
): ScreeningResultSnapshot[] {
  return subjectsForFixture(fixture).map((subject) => screenSubject(subject, screenedAt));
}

export async function screenFixtureForFixedGate(
  fixtureId: string,
  checkedAt: Date = new Date(),
): Promise<ScreeningGateOutcome> {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    select: {
      id: true,
      status: true,
      requirementId: true,
      ...FIXTURE_SCREENING_INCLUDE,
    },
  });
  if (fixture === null) {
    return { allowed: false, reason: 'Cannot fix: fixture was not found for screening.' };
  }

  const results = screenFixtureParties(fixture, checkedAt);
  await prisma.$transaction(async (tx) => {
    for (const result of results) {
      await persistResult(tx, result, {
        fixtureId,
        requirementId: fixture.requirementId,
        subjectId: result.subjectId,
      });
    }
  });

  return evaluateScreeningGate(fixture.status, 'FIXED', { checkedAt, results });
}

export async function screenChartererForRequirement(
  input: { requirementId: string; chartererId: string; name: string; sector: string | null },
  checkedAt: Date = new Date(),
): Promise<ScreeningResultSnapshot> {
  return prisma.$transaction((tx) => persistChartererScreeningForRequirement(tx, input, checkedAt));
}

export async function persistChartererScreeningForRequirement(
  tx: ScreeningPersistenceClient,
  input: { requirementId: string; chartererId: string; name: string; sector: string | null },
  checkedAt: Date = new Date(),
): Promise<ScreeningResultSnapshot> {
  const result = screenSubject({
    id: input.chartererId,
    subjectType: 'CHARTERER',
    name: input.name,
    sector: input.sector,
  }, checkedAt);

  await persistResult(tx, result, {
    fixtureId: null,
    requirementId: input.requirementId,
    subjectId: input.chartererId,
  });
  return result;
}
