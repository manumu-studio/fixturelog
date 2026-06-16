// index.ts — barrel for the copilot tool definitions, their broker-scoped executors, and the
// shared Zod schemas/types. Lets the agent loop import from one place.
export { buildCopilotTools } from './build-copilot-tools';
export {
  buildGatedAdvanceFixtureStatusTool,
  buildGatedGenerateRecapTool,
} from './approval-gated-write-tools';
export { buildGetFixtureTool, getFixtureForBroker } from './get-fixture.tool';
export { buildFindMatchesTool, findMatchesForBroker } from './find-matches.tool';
export {
  buildAdvanceFixtureStatusTool,
  executeAdvanceFixtureStatus,
} from './advance-fixture-status.tool';
export { buildGenerateRecapTool, executeGenerateRecap } from './generate-recap.tool';
export type {
  AdvanceFixtureStatusInput,
  AdvanceFixtureStatusResult,
  BrokerToolContext,
  FindMatchesInput,
  FindMatchesResult,
  GenerateRecapInput,
  GenerateRecapResult,
  GetFixtureInput,
  GetFixtureResult,
  ToolOutcome,
} from './copilot-tools.types';
export {
  AdvanceFixtureStatusInputSchema,
  AdvanceFixtureStatusResultSchema,
  FindMatchesInputSchema,
  FindMatchesResultSchema,
  GenerateRecapInputSchema,
  GenerateRecapResultSchema,
  GetFixtureInputSchema,
  GetFixtureResultSchema,
} from './copilot-tools.types';
