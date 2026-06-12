// Tests for FixtureStatusPolicy — full transition matrix, subject-lift gate, FIXED propagation

import { describe, expect, it } from 'vitest';
import { evaluateTransition } from './fixture-status-policy';

describe('FixtureStatusPolicy — valid forward transitions', () => {
  it('allows DRAFT -> NEGOTIATING', () => {
    const result = evaluateTransition('DRAFT', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows NEGOTIATING -> ON_SUBS', () => {
    const result = evaluateTransition('NEGOTIATING', 'ON_SUBS', { subjectStatuses: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows NEGOTIATING -> FAILED', () => {
    const result = evaluateTransition('NEGOTIATING', 'FAILED', { subjectStatuses: [] });
    expect(result.allowed).toBe(true);
  });

  it('allows ON_SUBS -> FIXED when all subjects are LIFTED', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: ['LIFTED'] });
    expect(result.allowed).toBe(true);
  });

  it('allows ON_SUBS -> FAILED regardless of subject statuses', () => {
    const result = evaluateTransition('ON_SUBS', 'FAILED', { subjectStatuses: ['PENDING'] });
    expect(result.allowed).toBe(true);
  });

  it('allows FIXED -> COMPLETED', () => {
    const result = evaluateTransition('FIXED', 'COMPLETED', { subjectStatuses: [] });
    expect(result.allowed).toBe(true);
  });
});

describe('FixtureStatusPolicy — same-status rejection', () => {
  it('rejects DRAFT -> DRAFT', () => {
    const result = evaluateTransition('DRAFT', 'DRAFT', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('Cannot transition to the same status');
  });

  it('rejects NEGOTIATING -> NEGOTIATING', () => {
    const result = evaluateTransition('NEGOTIATING', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects ON_SUBS -> ON_SUBS', () => {
    const result = evaluateTransition('ON_SUBS', 'ON_SUBS', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects FIXED -> FIXED', () => {
    const result = evaluateTransition('FIXED', 'FIXED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects COMPLETED -> COMPLETED', () => {
    const result = evaluateTransition('COMPLETED', 'COMPLETED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects FAILED -> FAILED', () => {
    const result = evaluateTransition('FAILED', 'FAILED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });
});

describe('FixtureStatusPolicy — terminal state rejection', () => {
  it('rejects COMPLETED -> DRAFT', () => {
    const result = evaluateTransition('COMPLETED', 'DRAFT', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('terminal status COMPLETED');
  });

  it('rejects COMPLETED -> NEGOTIATING', () => {
    const result = evaluateTransition('COMPLETED', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects FAILED -> DRAFT', () => {
    const result = evaluateTransition('FAILED', 'DRAFT', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('terminal status FAILED');
  });

  it('rejects FAILED -> NEGOTIATING', () => {
    const result = evaluateTransition('FAILED', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });
});

describe('FixtureStatusPolicy — illegal transition rejection', () => {
  it('rejects DRAFT -> FIXED', () => {
    const result = evaluateTransition('DRAFT', 'FIXED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/not allowed/);
  });

  it('rejects DRAFT -> COMPLETED', () => {
    const result = evaluateTransition('DRAFT', 'COMPLETED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects NEGOTIATING -> COMPLETED', () => {
    const result = evaluateTransition('NEGOTIATING', 'COMPLETED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects ON_SUBS -> DRAFT', () => {
    const result = evaluateTransition('ON_SUBS', 'DRAFT', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });

  it('rejects FIXED -> NEGOTIATING', () => {
    const result = evaluateTransition('FIXED', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
  });
});

describe('FixtureStatusPolicy — subject-gated FIXED (allowed paths)', () => {
  it('allows ON_SUBS -> FIXED with one LIFTED subject', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: ['LIFTED'] });
    expect(result.allowed).toBe(true);
  });

  it('allows ON_SUBS -> FIXED with LIFTED and WAIVED subjects', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', {
      subjectStatuses: ['LIFTED', 'WAIVED'],
    });
    expect(result.allowed).toBe(true);
  });

  it('allows ON_SUBS -> FIXED with all WAIVED subjects', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', {
      subjectStatuses: ['WAIVED'],
    });
    expect(result.allowed).toBe(true);
  });
});

describe('FixtureStatusPolicy — subject-gated FIXED (rejected paths)', () => {
  it('rejects ON_SUBS -> FIXED with no subjects', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: [] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('Cannot fix: fixture has no subjects to lift');
  });

  it('rejects ON_SUBS -> FIXED with one PENDING subject', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: ['PENDING'] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('1 still unresolved');
  });

  it('rejects ON_SUBS -> FIXED with LIFTED and PENDING subjects', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', {
      subjectStatuses: ['LIFTED', 'PENDING'],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('1 still unresolved');
  });

  it('rejects ON_SUBS -> FIXED with a FAILED subject', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: ['FAILED'] });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('1 still unresolved');
  });

  it('rejects ON_SUBS -> FIXED with mixed subjects — verifies {n} count', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', {
      subjectStatuses: ['LIFTED', 'PENDING', 'FAILED'],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain('2 still unresolved');
  });
});

describe('FixtureStatusPolicy — subject gate does NOT affect other transitions', () => {
  it('allows ON_SUBS -> FAILED even with PENDING subjects', () => {
    const result = evaluateTransition('ON_SUBS', 'FAILED', { subjectStatuses: ['PENDING'] });
    expect(result.allowed).toBe(true);
  });

  it('allows DRAFT -> NEGOTIATING with no subjects', () => {
    const result = evaluateTransition('DRAFT', 'NEGOTIATING', { subjectStatuses: [] });
    expect(result.allowed).toBe(true);
  });
});

describe('FixtureStatusPolicy — FIXED propagation shape', () => {
  it('returns requirementUpdate { status: FIXED } (no fixedAt key) on ON_SUBS -> FIXED', () => {
    const result = evaluateTransition('ON_SUBS', 'FIXED', { subjectStatuses: ['LIFTED'] });
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.requirementUpdate).toEqual({ status: 'FIXED' });
      expect(result.requirementUpdate).not.toHaveProperty('fixedAt');
      expect(result.fixtureFixedAt).toBeInstanceOf(Date);
    }
  });

  it('returns null requirementUpdate and null fixtureFixedAt for all other valid transitions', () => {
    const cases: Array<[Parameters<typeof evaluateTransition>[0], Parameters<typeof evaluateTransition>[1]]> = [
      ['DRAFT', 'NEGOTIATING'],
      ['NEGOTIATING', 'ON_SUBS'],
      ['NEGOTIATING', 'FAILED'],
      ['ON_SUBS', 'FAILED'],
      ['FIXED', 'COMPLETED'],
    ];

    for (const [from, to] of cases) {
      const result = evaluateTransition(from, to, { subjectStatuses: [] });
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.requirementUpdate).toBeNull();
        expect(result.fixtureFixedAt).toBeNull();
      }
    }
  });
});
