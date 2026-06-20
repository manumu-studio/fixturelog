// Deterministic sanctions screening: local fixture classification, TTL freshness,
// FIXED-gate rollup, and review-action boundaries.
import { loadLocalScreeningRecords, recordAppliesTo, type LocalScreeningRecord } from './local-source';
import { addHours, isExpired, normalizeScreeningText, SCREENING_TTL_HOURS } from './normalization';
import type {
  FixtureStatusForGate,
  ScreenableSubject,
  ScreeningGateInput,
  ScreeningGateOutcome,
  ScreeningMatchType,
  ScreeningResultSnapshot,
  ScreeningReviewAction,
  ScreeningReviewOutcome,
  ScreeningStatus,
} from './sanctions-screening.types';

function resultId(subject: ScreenableSubject, screenedAt: Date): string {
  return `local-${subject.subjectType}-${subject.id}-${screenedAt.getTime()}`;
}

function baseResult(
  subject: ScreenableSubject,
  screenedAt: Date,
  status: ScreeningStatus,
  reason: string,
): ScreeningResultSnapshot {
  return {
    id: resultId(subject, screenedAt),
    subjectType: subject.subjectType,
    subjectId: subject.id,
    subjectName: subject.name,
    status,
    reason,
    screenedAt,
    ttlExpiresAt: addHours(screenedAt, SCREENING_TTL_HOURS),
    sourceName: 'FixtureLog local sanctions fixture',
    sourceListName: 'Demo maritime sanctions fixture',
    sourceListVersion: '2026-06-20-local',
    matchType: 'NONE',
  };
}

function resultFromRecord(args: {
  subject: ScreenableSubject;
  record: LocalScreeningRecord;
  screenedAt: Date;
  matchType: ScreeningMatchType;
  matchedIdentifier: string | null;
  status: ScreeningStatus;
  reason: string;
}): ScreeningResultSnapshot {
  const { subject, record, screenedAt, matchType, matchedIdentifier, status, reason } = args;
  return {
    id: resultId(subject, screenedAt),
    subjectType: subject.subjectType,
    subjectId: subject.id,
    subjectName: subject.name,
    status,
    reason,
    screenedAt,
    ttlExpiresAt: addHours(screenedAt, SCREENING_TTL_HOURS),
    sourceName: record.sourceName,
    sourceJurisdiction: record.sourceJurisdiction,
    sourceListName: record.sourceListName,
    sourceListVersion: record.sourceListVersion,
    sourceListDate: record.sourceListDate,
    sourceRecordId: record.recordId,
    sourceRecordUrl: record.sourceRecordUrl,
    matchedName: record.names[0] ?? null,
    matchedIdentifier,
    matchType,
  };
}

function findImoHit(
  subject: ScreenableSubject,
  records: LocalScreeningRecord[],
): { record: LocalScreeningRecord; imo: string } | null {
  if (subject.subjectType !== 'VESSEL' || subject.imo === null || subject.imo === undefined) {
    return null;
  }
  for (const record of records) {
    if (recordAppliesTo(record, subject.subjectType) && record.imos.includes(subject.imo)) {
      return { record, imo: subject.imo };
    }
  }
  return null;
}

function namesMatch(subjectName: string, record: LocalScreeningRecord): boolean {
  const normalized = normalizeScreeningText(subjectName);
  return record.names.some((name) => normalizeScreeningText(name) === normalized);
}

function findNameHit(
  subject: ScreenableSubject,
  records: LocalScreeningRecord[],
): LocalScreeningRecord | null {
  for (const record of records) {
    if (recordAppliesTo(record, subject.subjectType) && namesMatch(subject.name, record)) {
      return record;
    }
  }
  return null;
}

function screenVessel(
  subject: ScreenableSubject,
  records: LocalScreeningRecord[],
  screenedAt: Date,
): ScreeningResultSnapshot {
  const imoHit = findImoHit(subject, records);
  if (imoHit !== null) {
    return resultFromRecord({
      subject,
      record: imoHit.record,
      screenedAt,
      matchType: 'IMO_EXACT',
      matchedIdentifier: imoHit.imo,
      status: imoHit.record.status,
      reason: `${imoHit.record.reason} Matched by exact IMO in local fixture.`,
    });
  }

  const hasImo = subject.imo !== null && subject.imo !== undefined && subject.imo.trim() !== '';
  const nameHit = findNameHit(subject, records);
  if (nameHit !== null) {
    return resultFromRecord({
      subject,
      record: nameHit,
      screenedAt,
      matchType: 'NAME_REVIEW',
      matchedIdentifier: null,
      status: 'REVIEW',
      reason: 'IMO missing or not matched; vessel name hit requires human review.',
    });
  }
  if (!hasImo) {
    return baseResult(subject, screenedAt, 'REVIEW', 'IMO missing; vessel identity needs review.');
  }
  return baseResult(subject, screenedAt, 'CLEAR', 'No local fixture hit.');
}

function screenParty(
  subject: ScreenableSubject,
  records: LocalScreeningRecord[],
  screenedAt: Date,
): ScreeningResultSnapshot {
  const nameHit = findNameHit(subject, records);
  if (nameHit === null) {
    return baseResult(subject, screenedAt, 'CLEAR', 'No local fixture hit.');
  }
  return resultFromRecord({
    subject,
    record: nameHit,
    screenedAt,
    matchType: 'NAME_EXACT',
    matchedIdentifier: null,
    status: nameHit.status,
    reason: `${nameHit.reason} Matched by exact normalized name in local fixture.`,
  });
}

export function screenSubject(
  subject: ScreenableSubject,
  screenedAt: Date = new Date(),
): ScreeningResultSnapshot {
  const records = loadLocalScreeningRecords();
  if (normalizeScreeningText(subject.name) === '') {
    return baseResult(subject, screenedAt, 'REVIEW', 'Subject name missing; review required.');
  }
  if (subject.subjectType === 'VESSEL') {
    return screenVessel(subject, records, screenedAt);
  }
  return screenParty(subject, records, screenedAt);
}

export function evaluateScreeningGate(
  fromStatus: FixtureStatusForGate,
  toStatus: FixtureStatusForGate,
  input: ScreeningGateInput,
): ScreeningGateOutcome {
  if (fromStatus !== 'ON_SUBS' || toStatus !== 'FIXED') {
    return { allowed: true };
  }
  if (input.results.length === 0) {
    return { allowed: false, reason: 'Cannot fix: sanctions screening has not run.' };
  }
  const blocked = input.results.find((result) => result.status === 'BLOCKED');
  if (blocked !== undefined) {
    return {
      allowed: false,
      reason: `Cannot fix: sanctions screening is BLOCKED for ${blocked.subjectName}.`,
    };
  }
  const stale = input.results.find((result) => isExpired(result.ttlExpiresAt, input.checkedAt));
  if (stale !== undefined) {
    return {
      allowed: false,
      reason: `Cannot fix: sanctions screening for ${stale.subjectName} requires re-check.`,
    };
  }
  const review = input.results.find((result) => result.status === 'REVIEW');
  if (review !== undefined) {
    return {
      allowed: false,
      reason: `Cannot fix: sanctions screening for ${review.subjectName} requires review.`,
    };
  }
  return { allowed: true };
}

export function evaluateReviewAction(
  result: ScreeningResultSnapshot,
  action: ScreeningReviewAction,
): ScreeningReviewOutcome {
  if (result.status === 'BLOCKED' && action === 'REVIEW_CLEARED') {
    return {
      allowed: false,
      reason: 'True BLOCKED screening results cannot be broker-cleared.',
    };
  }
  return { allowed: true };
}
