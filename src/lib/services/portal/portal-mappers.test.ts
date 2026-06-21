// portal-mappers.test.ts — covers pure portal DTO serialization.
import { describe, expect, it } from 'vitest';

import type { MatchResult } from '@/lib/services/fixture-matcher.types';
import {
  toDocument,
  toEnquirySummary,
  toFixtureSummary,
  toShortlistEntry,
  type FixtureRow,
  type RecapRow,
  type RequirementRow,
  type ShortlistVesselRow,
} from './portal-mappers';

const createdAt = new Date('2026-06-15T09:00:00.000Z');
const startDate = new Date('2026-07-01T00:00:00.000Z');
const endDate = new Date('2026-07-15T00:00:00.000Z');

describe('portal mappers', () => {
  it('serializes enquiry rows for the portal API', () => {
    const row: RequirementRow = {
      id: 'req-1',
      status: 'SHORTLISTED',
      vesselTypeNeeded: 'AHTS',
      charterType: 'SPOT',
      startDate,
      endDate,
      durationDays: 14,
      dayRateBudget: 55000,
      notes: 'North Sea rig move',
      createdAt,
      region: { name: 'North Sea', code: 'NORTH_SEA' },
      workscope: { name: 'Anchor handling' },
    };

    expect(toEnquirySummary(row)).toEqual({
      id: 'req-1',
      status: 'SHORTLISTED',
      vesselTypeNeeded: 'AHTS',
      regionName: 'North Sea',
      regionCode: 'NORTH_SEA',
      workscopeName: 'Anchor handling',
      charterType: 'SPOT',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationDays: 14,
      dayRateBudget: 55000,
      notes: 'North Sea rig move',
      createdAt: createdAt.toISOString(),
      screening: {
        status: 'NOT_SCREENED',
        screenedAt: null,
        ttlExpiresAt: null,
        source: null,
        reason: 'Not screened',
      },
    });
  });

  it('serializes fixture rows with subject and weather details', () => {
    const row: FixtureRow = {
      id: 'fixture-1',
      status: 'FIXED',
      agreedDayRate: 56798,
      currency: 'GBP',
      commencement: startDate,
      durationDays: 21,
      vessel: { name: 'Island Challenger', vesselType: 'AHTS' },
      region: { name: 'North Sea' },
      subjects: [
        {
          id: 'subject-1',
          label: 'Client approval',
          status: 'PENDING',
          dueAt: endDate,
          owner: 'Client',
        },
      ],
      weatherSnapshots: [{ workabilityVerdict: 'WORKABLE', fetchedAt: createdAt }],
    };

    expect(toFixtureSummary(row)).toEqual({
      id: 'fixture-1',
      vesselName: 'Island Challenger',
      vesselType: 'AHTS',
      status: 'FIXED',
      regionName: 'North Sea',
      agreedDayRate: 56798,
      currency: 'GBP',
      commencement: startDate.toISOString(),
      durationDays: 21,
      subjects: [
        {
          id: 'subject-1',
          label: 'Client approval',
          status: 'PENDING',
          dueAt: endDate.toISOString(),
          owner: 'Client',
        },
      ],
      weather: {
        verdict: 'WORKABLE',
        fetchedAt: createdAt.toISOString(),
        source: 'Open-Meteo Marine (seeded)',
      },
      screening: {
        status: 'NOT_SCREENED',
        screenedAt: null,
        ttlExpiresAt: null,
        source: null,
        reason: 'Not screened',
      },
    });
  });

  it('keeps nullable fixture fields null when no values exist', () => {
    const row: FixtureRow = {
      id: 'fixture-2',
      status: 'NEGOTIATING',
      agreedDayRate: 7134,
      currency: 'USD',
      commencement: null,
      durationDays: null,
      vessel: { name: 'Tidewater Atlas', vesselType: 'PSV' },
      region: { name: 'Brazil' },
      subjects: [{ id: 'subject-2', label: 'Stem details', status: 'WAIVED', dueAt: null, owner: null }],
      weatherSnapshots: [],
    };

    expect(toFixtureSummary(row)).toMatchObject({
      commencement: null,
      durationDays: null,
      subjects: [{ dueAt: null, owner: null }],
      weather: null,
    });
  });

  it('serializes recap rows into portal documents', () => {
    const recap: RecapRow = {
      id: 'recap-1',
      version: 2,
      approvedByBrokerId: 'broker-1',
      createdAt,
      generatedMarkdown: '# Recap',
      generatedText: 'Fixture recap',
      fixture: { vessel: { name: 'Skandi Vega' } },
      fixtureId: 'fixture-3',
    };

    expect(toDocument(recap)).toEqual({
      id: 'recap-1',
      fixtureId: 'fixture-3',
      vesselName: 'Skandi Vega',
      version: 2,
      isFinal: true,
      createdAt: createdAt.toISOString(),
      generatedMarkdown: '# Recap',
      generatedText: 'Fixture recap',
    });
  });

  it('combines matcher output with vessel specs for shortlist cards', () => {
    const result: MatchResult = {
      vesselId: 'vessel-1',
      vesselName: 'Normand Vision',
      score: 91,
      rank: 1,
      factors: { distance: 94, rateFit: 88, capabilityMargin: 92 },
    };
    const vessel: ShortlistVesselRow = {
      id: 'vessel-1',
      vesselType: 'MPSV',
      dpClass: 'DP3',
      deckAreaM2: 1100,
      bollardPullT: 100,
      status: 'OPEN',
      imageUrl: '/assets/vessels/real/normand-vision.jpg',
    };

    expect(toShortlistEntry(result, vessel)).toEqual({
      vesselId: 'vessel-1',
      vesselName: 'Normand Vision',
      vesselType: 'MPSV',
      dpClass: 'DP3',
      deckAreaM2: 1100,
      bollardPullT: 100,
      status: 'OPEN',
      imageUrl: '/assets/vessels/real/normand-vision.jpg',
      score: 91,
      rank: 1,
      factors: { distance: 94, rateFit: 88, capabilityMargin: 92 },
      screening: {
        status: 'NOT_SCREENED',
        screenedAt: null,
        ttlExpiresAt: null,
        source: null,
        reason: 'Not screened',
      },
    });
  });
});
