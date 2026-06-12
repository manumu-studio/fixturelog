// Render tests for ShortlistView — uses react-dom/server renderToStaticMarkup (no jsdom needed)
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShortlistView } from './ShortlistView';
import type { RequirementDetail, MatchData } from './ShortlistView';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const baseRequirement: RequirementDetail = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx01',
  vesselTypeNeeded: 'PSV',
  status: 'SHORTLISTED',
  startDate: '2026-08-01T00:00:00.000Z',
  dayRateBudget: 18000,
  minDpClass: 'DP2',
  minDeckAreaM2: 500,
  minBollardPullT: null,
  region: { name: 'North Sea', code: 'NS' },
  charterer: { name: 'Acme Energy' },
};

const baseMatchWithResults: MatchData = {
  requirementId: 'clxxxxxxxxxxxxxxxxxxxxxx01',
  status: 'SHORTLISTED',
  totalCandidates: 10,
  passedFilters: 3,
  results: [
    {
      vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx02',
      vesselName: 'Nordic Star',
      score: 87.4,
      rank: 1,
      factors: { distance: 90, rateFit: 85, capabilityMargin: 80 },
    },
    {
      vesselId: 'clxxxxxxxxxxxxxxxxxxxxxx03',
      vesselName: 'Atlantic Pioneer',
      score: 72.1,
      rank: 2,
      factors: { distance: 70, rateFit: 75, capabilityMargin: 68 },
    },
  ],
  weightsUsed: { distance: 0.4, rateFit: 0.35, capabilityMargin: 0.25 },
};

const emptyMatch: MatchData = {
  requirementId: 'clxxxxxxxxxxxxxxxxxxxxxx01',
  status: 'ENQUIRY',
  totalCandidates: 5,
  passedFilters: 0,
  results: [],
  weightsUsed: { distance: 0.4, rateFit: 0.35, capabilityMargin: 0.25 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ShortlistView', () => {
  it('renders ranked shortlist table with match data and weights footer', () => {
    const html = renderToStaticMarkup(
      <ShortlistView requirement={baseRequirement} match={baseMatchWithResults} />,
    );

    // Requirement summary header
    expect(html).toContain('Acme Energy');
    expect(html).toContain('PSV');
    expect(html).toContain('North Sea');

    // Ranked table rows
    expect(html).toContain('Nordic Star');
    expect(html).toContain('Atlantic Pioneer');
    expect(html).toContain('87'); // Math.round(87.4)
    expect(html).toContain('72'); // Math.round(72.1)

    // Weights footer
    expect(html).toContain('0.4');
    expect(html).toContain('0.35');
    expect(html).toContain('0.25');
  });

  it('renders no-candidates message with passedFilters and totalCandidates when results is empty', () => {
    const html = renderToStaticMarkup(
      <ShortlistView requirement={baseRequirement} match={emptyMatch} />,
    );

    expect(html).toContain('No eligible vessels found for this requirement.');
    expect(html).toContain('0 passed filters');
    expect(html).toContain('5 total candidates');

    // Table must NOT be present
    expect(html).not.toContain('<table');
  });
});
