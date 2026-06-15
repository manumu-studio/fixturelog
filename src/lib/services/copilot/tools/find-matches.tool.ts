// find-matches.tool.ts — read tool: run the matcher for a requirement, return the ranked
// shortlist. Thin wrapper over the existing FixtureMatcher service (the scoring engine is
// reused, not re-implemented); the DB→matcher mapping is delegated to find-matches.mappers.
// Auto-executes (read-only) and does NOT mutate requirement status the way the route does — a
// read tool must have no side effects. brokerId is closed over for the broker gate; requirements
// have no brokerId column, so scoping here is the session guard itself (every broker sees the
// shared requirement/vessel pool, exactly as the match route does).
import 'server-only';
import { tool, type Tool } from 'ai';
import { prisma } from '@/lib/prisma';
import { match } from '@/lib/services/fixture-matcher';
import { DEFAULT_WEIGHTS } from '@/lib/services/fixture-matcher.types';
import {
  toMatchBenchmark,
  toMatchCandidate,
  toMatchRequirement,
} from './find-matches.mappers';
import {
  FindMatchesInputSchema,
  FindMatchesResultSchema,
  type BrokerToolContext,
  type FindMatchesResult,
  type ToolOutcome,
} from './copilot-tools.types';

// Cap the shortlist surfaced to the model — a copilot answer needs the top candidates, not the
// full filtered set.
const SHORTLIST_LIMIT = 10;

export async function findMatchesForBroker(
  _ctx: BrokerToolContext,
  requirementId: string,
): Promise<ToolOutcome<FindMatchesResult>> {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { region: { select: { centerLat: true, centerLng: true } } },
  });

  if (requirement === null) {
    return { ok: false, error: 'Requirement not found.' };
  }

  const [vessels, benchmarks] = await Promise.all([
    prisma.vessel.findMany({
      include: { positions: { orderBy: { capturedAt: 'desc' }, take: 1 } },
    }),
    prisma.rateBenchmark.findMany({
      where: { regionId: requirement.regionId, vesselType: requirement.vesselTypeNeeded },
    }),
  ]);

  const results = match(
    toMatchRequirement(requirement),
    vessels.map(toMatchCandidate),
    benchmarks.map(toMatchBenchmark),
    DEFAULT_WEIGHTS,
  );

  const data = FindMatchesResultSchema.parse({
    requirementId,
    totalCandidates: vessels.length,
    passedFilters: results.length,
    shortlist: results.slice(0, SHORTLIST_LIMIT).map((r) => ({
      vesselId: r.vesselId,
      vesselName: r.vesselName,
      score: r.score,
      rank: r.rank,
    })),
  });
  return { ok: true, data };
}

export function buildFindMatchesTool(ctx: BrokerToolContext): Tool {
  return tool({
    description: 'Run the matcher for a requirement and return the ranked vessel shortlist.',
    inputSchema: FindMatchesInputSchema,
    execute: ({ requirementId }) => findMatchesForBroker(ctx, requirementId),
  });
}
