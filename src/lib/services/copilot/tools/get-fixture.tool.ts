// get-fixture.tool.ts — read tool: fetch one fixture + its status + subjects, broker-scoped.
// Thin wrapper over the same Prisma read the GET /api/fixtures/:id route uses, plus a
// `where: { brokerId }` filter so a broker can only read its own desk's fixtures. Auto-executes
// (read-only). brokerId is closed over from the session context, never taken from tool args.
import 'server-only';
import { tool, type Tool } from 'ai';
import { prisma } from '@/lib/prisma';
import {
  GetFixtureInputSchema,
  GetFixtureResultSchema,
  type BrokerToolContext,
  type GetFixtureResult,
  type ToolOutcome,
} from './copilot-tools.types';

// Broker-scoped read of a single fixture. Returns a typed, Zod-validated outcome; the matching
// `not found` rejection covers both a wrong id and a fixture owned by another broker (the
// brokerId filter makes the two indistinguishable, which is the desired isolation).
export async function getFixtureForBroker(
  ctx: BrokerToolContext,
  fixtureId: string,
): Promise<ToolOutcome<GetFixtureResult>> {
  const fixture = await prisma.fixture.findFirst({
    where: { id: fixtureId, brokerId: ctx.brokerId },
    include: {
      vessel: { select: { name: true } },
      charterer: { select: { name: true } },
      region: { select: { name: true } },
      subjects: { select: { id: true, label: true, status: true } },
    },
  });

  if (fixture === null) {
    return { ok: false, error: 'Fixture not found on your desk.' };
  }

  const openSubjects = fixture.subjects.filter((s) => s.status === 'PENDING').length;
  const data = GetFixtureResultSchema.parse({
    id: fixture.id,
    status: fixture.status,
    vesselName: fixture.vessel.name,
    chartererName: fixture.charterer.name,
    regionName: fixture.region.name,
    agreedDayRate: fixture.agreedDayRate,
    currency: fixture.currency,
    subjects: fixture.subjects,
    openSubjects,
  });
  return { ok: true, data };
}

// Builds the auto-executing read tool, closing over the session context.
export function buildGetFixtureTool(ctx: BrokerToolContext): Tool {
  return tool({
    description: "Fetch one fixture on the broker's desk with its status and subjects.",
    inputSchema: GetFixtureInputSchema,
    execute: ({ fixtureId }) => getFixtureForBroker(ctx, fixtureId),
  });
}
