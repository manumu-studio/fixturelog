// generate-recap.tool.ts — write tool: generate + persist a SUPPLYTIME 2017 recap for a fixture.
// PROPOSED ONLY in the agent loop — the tool() definition omits `execute`, so the agent surfaces
// the call for the human confirm gate. The real, broker-scoped logic lives in
// `executeGenerateRecap`, which reuses buildMainTerms + the recap-formatter service and mirrors
// the POST /api/fixtures/:id/recap route (same FIXED/COMPLETED gate, same versioning).
// brokerId is session-derived (never a tool arg).
import 'server-only';
import { tool, type Tool } from 'ai';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatRecap, type RecapMainTerms } from '@/lib/services/recap-formatter';
import { buildMainTerms } from '@/app/api/fixtures/[id]/recap/recap.helpers';
import {
  GenerateRecapInputSchema,
  GenerateRecapResultSchema,
  type BrokerToolContext,
  type GenerateRecapResult,
  type ToolOutcome,
} from './copilot-tools.types';

// Prisma's Json column rejects `null` values inside InputJsonValue, so drop the null/undefined
// optional fields rather than reach for an `as` cast. The result is a JSON-safe object that
// satisfies Prisma.InputJsonObject cleanly.
function toJsonTerms(terms: RecapMainTerms): Prisma.InputJsonObject {
  const entries = Object.entries(terms).filter(
    (entry): entry is [string, string] => entry[1] !== null && entry[1] !== undefined,
  );
  return Object.fromEntries(entries);
}

const RECAP_FIXTURE_INCLUDE = {
  vessel: { include: { owner: true } },
  charterer: true,
  region: true,
  workscope: true,
  broker: true,
  recaps: { select: { version: true }, orderBy: { version: 'desc' }, take: 1 },
} as const;

export async function executeGenerateRecap(
  ctx: BrokerToolContext,
  fixtureId: string,
): Promise<ToolOutcome<GenerateRecapResult>> {
  const fixture = await prisma.fixture.findFirst({
    where: { id: fixtureId, brokerId: ctx.brokerId },
    include: RECAP_FIXTURE_INCLUDE,
  });

  if (fixture === null) {
    return { ok: false, error: 'Fixture not found on your desk.' };
  }

  if (fixture.status !== 'FIXED' && fixture.status !== 'COMPLETED') {
    return { ok: false, error: 'Recap can only be generated for FIXED or COMPLETED fixtures.' };
  }

  const mainTerms = buildMainTerms(fixture);
  const { markdown, text } = formatRecap(mainTerms);
  const version = (fixture.recaps[0]?.version ?? 0) + 1;

  const recap = await prisma.recap.create({
    data: {
      fixtureId,
      version,
      generatedMarkdown: markdown,
      generatedText: text,
      mainTerms: toJsonTerms(mainTerms),
    },
  });

  const data = GenerateRecapResultSchema.parse({
    fixtureId,
    recapId: recap.id,
    version: recap.version,
    markdown,
  });
  return { ok: true, data };
}

// Proposed-only tool: no `execute`, so the agent emits the call for the confirm gate.
export function buildGenerateRecapTool(): Tool {
  return tool({
    description:
      'Propose generating a SUPPLYTIME 2017 recap for a FIXED or COMPLETED fixture. Requires confirmation.',
    inputSchema: GenerateRecapInputSchema,
  });
}
