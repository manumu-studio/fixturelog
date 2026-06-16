// build-copilot-tools.ts — assembles the copilot's runtime toolset from a single session-derived
// BrokerToolContext. The agent loop calls this with the brokerId from requireBrokerApi
// so every tool is broker-scoped by construction. Read tools auto-execute within the bounded
// loop; write tools are approval-gated (`needsApproval: true`) so they surface as a proposed
// action and only mutate after the broker approves, then run through their broker-scoped executors.
import 'server-only';
import type { ToolSet } from 'ai';
import { buildGetFixtureTool } from './get-fixture.tool';
import { buildFindMatchesTool } from './find-matches.tool';
import {
  buildGatedAdvanceFixtureStatusTool,
  buildGatedGenerateRecapTool,
} from './approval-gated-write-tools';
import type { BrokerToolContext } from './copilot-tools.types';

export function buildCopilotTools(ctx: BrokerToolContext): ToolSet {
  return {
    getFixture: buildGetFixtureTool(ctx),
    findMatches: buildFindMatchesTool(ctx),
    advanceFixtureStatus: buildGatedAdvanceFixtureStatusTool(ctx),
    generateRecap: buildGatedGenerateRecapTool(ctx),
  };
}
