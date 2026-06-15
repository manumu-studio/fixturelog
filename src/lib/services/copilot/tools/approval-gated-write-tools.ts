// approval-gated-write-tools.ts — the agent-layer wrappers that turn the proposed-only
// write tools into the human-in-the-loop confirm gate. In AI SDK v6 the gate is the per-tool
// `needsApproval: true` flag: the model's tool call is surfaced to the client as a
// `tool-approval-request` and the wrapped `execute` runs ONLY after a matching `tool-approval-
// response` (the broker's approval) replays through the loop. The real mutation still routes
// through the broker-scoped executors, so the subject-lift gate + legal-transition policy keep
// blocking illegal writes even once approved. brokerId is session-derived (closed over), never a
// tool arg. The bare `tool()` definitions in *.tool.ts stay proposed-only; only these runtime
// wrappers carry an `execute`.
import 'server-only';
import { tool, type Tool } from 'ai';
import { executeAdvanceFixtureStatus } from './advance-fixture-status.tool';
import { executeGenerateRecap } from './generate-recap.tool';
import {
  AdvanceFixtureStatusInputSchema,
  GenerateRecapInputSchema,
  type BrokerToolContext,
} from './copilot-tools.types';

// Write tool: advance a fixture's status. Gated on broker approval; on approval the executor
// re-checks the status policy + subject-lift gate, so an illegal FIX is still rejected (the
// executor returns { ok: false, error } and the model relays it — nothing mutates).
export function buildGatedAdvanceFixtureStatusTool(ctx: BrokerToolContext): Tool {
  return tool({
    description:
      'Propose advancing a fixture to a new status (e.g. ON_SUBS, FIXED). Requires the broker to approve before it runs; the subject-lift gate applies for FIXED.',
    inputSchema: AdvanceFixtureStatusInputSchema,
    needsApproval: true,
    execute: ({ fixtureId, toStatus }) => executeAdvanceFixtureStatus(ctx, fixtureId, toStatus),
  });
}

// Write tool: generate + persist a recap. Gated on broker approval; on approval the executor
// enforces the FIXED/COMPLETED gate (rejection relayed, no mutation otherwise).
export function buildGatedGenerateRecapTool(ctx: BrokerToolContext): Tool {
  return tool({
    description:
      'Propose generating a SUPPLYTIME 2017 recap for a FIXED or COMPLETED fixture. Requires the broker to approve before it runs.',
    inputSchema: GenerateRecapInputSchema,
    needsApproval: true,
    execute: ({ fixtureId }) => executeGenerateRecap(ctx, fixtureId),
  });
}
