// Tests for deterministic sanctions screening: local fixture parsing, classification,
// freshness, gate rollups, and true BLOCKED review boundaries.
import { describe, expect, it } from 'vitest';
import {
  evaluateReviewAction,
  evaluateScreeningGate,
  screenSubject,
} from './sanctions-screening';
import type { ScreenableSubject, ScreeningResultSnapshot } from './sanctions-screening.types';

const NOW = new Date('2026-06-20T12:00:00.000Z');

function vessel(input: {
  id: string;
  name: string;
  imo: string | null;
}): ScreenableSubject {
  return {
    id: input.id,
    subjectType: 'VESSEL',
    name: input.name,
    imo: input.imo,
    mmsi: null,
    flagState: null,
  };
}

function clearResult(overrides: {
  id: string;
  subjectType: ScreeningResultSnapshot['subjectType'];
  subjectName: string;
  ttlExpiresAt?: Date;
}): ScreeningResultSnapshot {
  return {
    id: overrides.id,
    subjectType: overrides.subjectType,
    subjectId: overrides.id,
    subjectName: overrides.subjectName,
    status: 'CLEAR',
    reason: 'No local fixture hit.',
    screenedAt: NOW,
    ttlExpiresAt: overrides.ttlExpiresAt ?? new Date('2026-06-21T12:00:00.000Z'),
    sourceName: 'FixtureLog local sanctions fixture',
    sourceListName: 'Demo maritime sanctions fixture',
    sourceListVersion: '2026-06-20-local',
  };
}

describe('screenSubject', () => {
  it('classifies an exact vessel IMO fixture hit as BLOCKED with 24h TTL provenance', () => {
    const result = screenSubject(vessel({ id: 'v-umka', name: 'UMKA', imo: '9171620' }), NOW);

    expect(result.status).toBe('BLOCKED');
    expect(result.matchType).toBe('IMO_EXACT');
    expect(result.matchedIdentifier).toBe('9171620');
    expect(result.sourceName).toBe('FixtureLog local sanctions fixture');
    expect(result.sourceListVersion).toBe('2026-06-20-local');
    expect(result.screenedAt.toISOString()).toBe('2026-06-20T12:00:00.000Z');
    expect(result.ttlExpiresAt.toISOString()).toBe('2026-06-21T12:00:00.000Z');
    expect(result.reason).toMatch(/local fixture/i);
  });

  it('classifies a strong no-hit vessel identity as CLEAR', () => {
    const result = screenSubject(
      vessel({ id: 'v-clear', name: 'Normand Pioneer', imo: '9179751' }),
      NOW,
    );

    expect(result.status).toBe('CLEAR');
    expect(result.matchType).toBe('NONE');
    expect(result.reason).toMatch(/No local fixture hit/);
  });

  it('classifies a listed vessel name hit without IMO as REVIEW rather than BLOCKED', () => {
    const result = screenSubject(vessel({ id: 'v-review', name: 'UMKA', imo: null }), NOW);

    expect(result.status).toBe('REVIEW');
    expect(result.matchType).toBe('NAME_REVIEW');
    expect(result.reason).toMatch(/IMO missing/i);
  });
});

describe('evaluateScreeningGate', () => {
  it('allows ON_SUBS -> FIXED only when every party has fresh CLEAR evidence', () => {
    const outcome = evaluateScreeningGate('ON_SUBS', 'FIXED', {
      checkedAt: NOW,
      results: [
        clearResult({ id: 'sr-v', subjectType: 'VESSEL', subjectName: 'Normand Pioneer' }),
        clearResult({ id: 'sr-o', subjectType: 'OWNER', subjectName: 'Solstad Offshore ASA' }),
        clearResult({ id: 'sr-c', subjectType: 'CHARTERER', subjectName: 'Equinor ASA' }),
      ],
    });

    expect(outcome.allowed).toBe(true);
  });

  it('blocks ON_SUBS -> FIXED on true BLOCKED evidence', () => {
    const blocked = screenSubject(vessel({ id: 'v-umka', name: 'UMKA', imo: '9171620' }), NOW);
    const outcome = evaluateScreeningGate('ON_SUBS', 'FIXED', {
      checkedAt: NOW,
      results: [blocked],
    });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) {
      expect(outcome.reason).toMatch(/blocked/i);
      expect(outcome.reason).toMatch(/UMKA/);
    }
  });

  it('blocks ON_SUBS -> FIXED when evidence is older than the 24h TTL', () => {
    const stale = clearResult({
      id: 'sr-stale',
      subjectType: 'CHARTERER',
      subjectName: 'Equinor ASA',
      ttlExpiresAt: new Date('2026-06-20T11:59:59.999Z'),
    });
    const outcome = evaluateScreeningGate('ON_SUBS', 'FIXED', {
      checkedAt: NOW,
      results: [stale],
    });

    expect(outcome.allowed).toBe(false);
    if (!outcome.allowed) expect(outcome.reason).toMatch(/re-check/i);
  });

  it('does not apply sanctions screening to non-FIXED transitions', () => {
    const blocked = screenSubject(vessel({ id: 'v-umka', name: 'UMKA', imo: '9171620' }), NOW);
    const outcome = evaluateScreeningGate('NEGOTIATING', 'ON_SUBS', {
      checkedAt: NOW,
      results: [blocked],
    });

    expect(outcome.allowed).toBe(true);
  });
});

describe('evaluateReviewAction', () => {
  it('does not allow a broker to clear a true BLOCKED result', () => {
    const blocked = screenSubject(vessel({ id: 'v-umka', name: 'UMKA', imo: '9171620' }), NOW);

    expect(evaluateReviewAction(blocked, 'REVIEW_CLEARED')).toEqual({
      allowed: false,
      reason: 'True BLOCKED screening results cannot be broker-cleared.',
    });
    expect(evaluateReviewAction(blocked, 'ESCALATED')).toEqual({ allowed: true });
    expect(evaluateReviewAction(blocked, 'CANNOT_PROCEED')).toEqual({ allowed: true });
  });
});
