// ShortlistView — pure presentational component for the ranked shortlist detail
// No fetch calls; receives typed props from the page server component.
import { z } from 'zod';
import { PortalCard, StatusBadge } from '@/components/portal';
import { formatDate, formatRate } from '@/lib/utils/format';
import styles from './ShortlistView.module.css';

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function WeightsFooter({ weights }: { weights: MatchData['weightsUsed'] }) {
  return (
    <PortalCard>
      <h2 className={styles.sideHeading}>Scoring weights</h2>
      <dl className={styles.weightGrid}>
        <DetailRow label="Distance" value={String(weights.distance)} />
        <DetailRow label="Rate fit" value={String(weights.rateFit)} />
        <DetailRow label="Capability" value={String(weights.capabilityMargin)} />
      </dl>
    </PortalCard>
  );
}

function EmptyCandidates({ passedFilters, totalCandidates }: { passedFilters: number; totalCandidates: number }) {
  return (
    <p className={styles.empty}>
      No eligible vessels found for this requirement.
      {' '}({passedFilters} passed filters / {totalCandidates} total candidates)
    </p>
  );
}

function ScoreCell({ value }: { value: number }) {
  return <span className={styles.score}>{Math.round(value)}</span>;
}

function ShortlistTable({ results }: { results: MatchData['results'] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Vessel name</th>
            <th>Overall score</th>
            <th>Distance</th>
            <th>Rate fit</th>
            <th>Capability margin</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.vesselId}>
              <td>#{result.rank}</td>
              <td className={styles.vesselName}>{result.vesselName}</td>
              <td><ScoreCell value={result.score} /></td>
              <td><ScoreCell value={result.factors.distance} /></td>
              <td><ScoreCell value={result.factors.rateFit} /></td>
              <td><ScoreCell value={result.factors.capabilityMargin} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewGate() {
  return (
    <PortalCard>
      <h2 className={styles.sideHeading}>Broker review gate</h2>
      <p className={styles.reviewCopy}>
        Match score is commercial evidence, not clearance. Before a recap becomes a fixture,
        the broker should review charterer, owner, operator, and vessel evidence with a
        recorded human decision.
      </p>
      <ul className={styles.reviewList}>
        <li>Commercial match</li>
        <li>Screening evidence</li>
        <li>Human review note</li>
      </ul>
    </PortalCard>
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
    <div className={styles.layout}>
      <div className={styles.side}>
        <PortalCard>
          <p className={styles.eyebrow}>Requirement</p>
          <h1 className={styles.title}>{requirement.charterer.name}</h1>
          <p className={styles.subtitle}>{requirement.vesselTypeNeeded} · {requirement.region.name}</p>
          <div className={styles.statusLine}>
            <StatusBadge status={requirement.status} />
          </div>
          <dl className={styles.details}>
            <DetailRow label="Region" value={`${requirement.region.name} (${requirement.region.code})`} />
            <DetailRow label="Start" value={formatDate(requirement.startDate)} />
            <DetailRow label="Budget" value={formatRate(requirement.dayRateBudget, 'USD')} />
            {requirement.minDpClass !== null && (
              <DetailRow label="DP class" value={requirement.minDpClass} />
            )}
            {requirement.minDeckAreaM2 !== null && (
              <DetailRow label="Min deck area" value={`${requirement.minDeckAreaM2} m²`} />
            )}
            {requirement.minBollardPullT !== null && (
              <DetailRow label="Min bollard pull" value={`${requirement.minBollardPullT} T`} />
            )}
          </dl>
        </PortalCard>

        <ReviewGate />
        <WeightsFooter weights={match.weightsUsed} />
      </div>

      <PortalCard className={styles.shortlist ?? ''}>
        <div className={styles.shortlistHeader}>
          <div>
            <p className={styles.eyebrow}>Ranked shortlist</p>
            <h2 className={styles.shortlistTitle}>
              {match.passedFilters} of {match.totalCandidates} candidates passed filters
            </h2>
          </div>
          <StatusBadge status={match.status} />
        </div>
        {match.results.length === 0
          ? <EmptyCandidates passedFilters={match.passedFilters} totalCandidates={match.totalCandidates} />
          : <ShortlistTable results={match.results} />
        }
      </PortalCard>
    </div>
  );
}
