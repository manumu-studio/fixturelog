// ShortlistView — pure presentational component for the ranked shortlist detail
// No fetch calls; receives typed props from the page server component.
import { z } from 'zod';

export const MatchResponseSchema = z.object({
  data: z.object({
    requirementId: z.string(),
    status: z.string(),
    totalCandidates: z.number(),
    passedFilters: z.number(),
    results: z.array(z.object({
      vesselId: z.string(),
      vesselName: z.string(),
      score: z.number(),
      rank: z.number(),
      factors: z.object({
        distance: z.number(),
        rateFit: z.number(),
        capabilityMargin: z.number(),
      }),
    })),
    weightsUsed: z.object({
      distance: z.number(),
      rateFit: z.number(),
      capabilityMargin: z.number(),
    }),
  }),
});

export type MatchData = z.infer<typeof MatchResponseSchema>['data'];

export const RequirementDetailSchema = z.object({
  id: z.string(),
  vesselTypeNeeded: z.string(),
  status: z.string(),
  startDate: z.string(),
  dayRateBudget: z.number().nullable(),
  minDpClass: z.string().nullable(),
  minDeckAreaM2: z.number().nullable(),
  minBollardPullT: z.number().nullable(),
  region: z.object({ name: z.string(), code: z.string() }),
  charterer: z.object({ name: z.string() }),
});

export type RequirementDetail = z.infer<typeof RequirementDetailSchema>;

function WeightsFooter({ weights }: { weights: MatchData['weightsUsed'] }) {
  return (
    <footer>
      <small>
        Weights — Distance: {weights.distance} / Rate Fit: {weights.rateFit} / Capability: {weights.capabilityMargin}
      </small>
    </footer>
  );
}

function EmptyCandidates({ passedFilters, totalCandidates }: { passedFilters: number; totalCandidates: number }) {
  return (
    <p>
      No eligible vessels found for this requirement.
      {' '}({passedFilters} passed filters / {totalCandidates} total candidates)
    </p>
  );
}

function ShortlistTable({ results }: { results: MatchData['results'] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Vessel Name</th>
          <th>Overall Score</th>
          <th>Distance</th>
          <th>Rate Fit</th>
          <th>Capability Margin</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={r.vesselId}>
            <td>{r.rank}</td>
            <td>{r.vesselName}</td>
            <td>{Math.round(r.score)}</td>
            <td>{Math.round(r.factors.distance)}</td>
            <td>{Math.round(r.factors.rateFit)}</td>
            <td>{Math.round(r.factors.capabilityMargin)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ShortlistView({
  requirement,
  match,
}: {
  requirement: RequirementDetail;
  match: MatchData;
}) {
  return (
    <main>
      <section>
        <h1>{requirement.charterer.name} — {requirement.vesselTypeNeeded}</h1>
        <p>Region: {requirement.region.name} ({requirement.region.code})</p>
        <p>Status: {requirement.status}</p>
        <p>Start: {new Date(requirement.startDate).toLocaleDateString('en-GB')}</p>
        {requirement.minDpClass != null && <p>DP Class: {requirement.minDpClass}</p>}
        {requirement.minDeckAreaM2 != null && <p>Min Deck Area: {requirement.minDeckAreaM2} m²</p>}
        {requirement.minBollardPullT != null && <p>Min Bollard Pull: {requirement.minBollardPullT} T</p>}
        {requirement.dayRateBudget != null && <p>Budget: ${requirement.dayRateBudget.toLocaleString()}/day</p>}
      </section>

      <section>
        <h2>Shortlist ({match.passedFilters} of {match.totalCandidates} candidates)</h2>
        {match.results.length === 0
          ? <EmptyCandidates passedFilters={match.passedFilters} totalCandidates={match.totalCandidates} />
          : <ShortlistTable results={match.results} />
        }
      </section>

      <WeightsFooter weights={match.weightsUsed} />
    </main>
  );
}
