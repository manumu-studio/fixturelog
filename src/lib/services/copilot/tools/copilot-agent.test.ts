// copilot-agent.test.ts — agent-layer guarantees for the broker copilot. These tests drive the
// real bounded tool-using loop (generateText + stepCountIs) with a deterministic MockLanguageModel,
// never a live model. They lock down the four properties that make the copilot safe:
//   1. tool routing — the loop dispatches the model's tool call to the matching tool;
//   2. bounded loop — the step cap stops a model that keeps asking for tools (no runaway);
//   3. confirm gate — a WRITE tool cannot mutate without an explicit approval, and runs exactly
//      once on approval (the single most important property of v2);
//   4. write rejection — an executor rejection (e.g. an illegal status) is relayed, never mutated.
// Read tools run for real (Prisma is stubbed); write executors are mocked so the write path is
// observable as a spy — the cleanest proof of "no mutation without approval".
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateText,
  stepCountIs,
  type ModelMessage,
  type ToolSet,
} from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import type {
  LanguageModelV3Content,
  LanguageModelV3GenerateResult,
} from '@ai-sdk/provider';

// Stub Prisma so the REAL read tools (getFixtureForBroker / findMatchesForBroker) execute without
// a database. The write path is the part we must observe, so its executors are mocked spies.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findFirst: vi.fn() },
    requirement: { findUnique: vi.fn() },
    vessel: { findMany: vi.fn() },
    rateBenchmark: { findMany: vi.fn() },
  },
}));

const advanceSpy = vi.fn();
const recapSpy = vi.fn();
vi.mock('./advance-fixture-status.tool', () => ({
  executeAdvanceFixtureStatus: (...args: unknown[]) => advanceSpy(...args),
}));
vi.mock('./generate-recap.tool', () => ({
  executeGenerateRecap: (...args: unknown[]) => recapSpy(...args),
}));

import { prisma } from '@/lib/prisma';
import { buildCopilotTools } from './build-copilot-tools';

const ctx = { brokerId: 'broker-1' } as const;
const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

// A stable, fully-typed doGenerate result so the mock satisfies LanguageModelV3 without `as`.
function genResult(content: LanguageModelV3Content[]): LanguageModelV3GenerateResult {
  const sawToolCall = content.some((part) => part.type === 'tool-call');
  return {
    content,
    finishReason: { unified: sawToolCall ? 'tool-calls' : 'stop', raw: undefined },
    usage: {
      inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
      outputTokens: { total: 1, text: 1, reasoning: undefined },
    },
    warnings: [],
  };
}

function textPart(text: string): LanguageModelV3Content {
  return { type: 'text', text };
}

function toolCallPart(toolName: string, input: Record<string, unknown>): LanguageModelV3Content {
  return { type: 'tool-call', toolCallId: `call-${toolName}`, toolName, input: JSON.stringify(input) };
}

// Drives generateText through the real loop with a script of doGenerate results. Each model turn
// pops the next scripted result; once exhausted the model returns a plain text answer (the loop
// would otherwise have no terminating turn).
function scriptedModel(turns: LanguageModelV3Content[][]): MockLanguageModelV3 {
  let turn = 0;
  return new MockLanguageModelV3({
    doGenerate: async () => {
      const content = turns[turn] ?? [textPart('Done.')];
      turn += 1;
      return genResult(content);
    },
  });
}

function runAgent(model: MockLanguageModelV3, tools: ToolSet, maxSteps: number) {
  const messages: ModelMessage[] = [{ role: 'user', content: 'do the thing' }];
  return generateText({ model, tools, messages, stopWhen: stepCountIs(maxSteps) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('copilot agent — tool routing', () => {
  it('dispatches the model tool call to the matching read tool, then answers', async () => {
    // The real getFixtureForBroker runs; only its Prisma read is stubbed.
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      id: FIXTURE_ID,
      status: 'ON_SUBS',
      agreedDayRate: 7500,
      currency: 'GBP',
      vessel: { name: 'Island Challenger' },
      charterer: { name: 'Equinor' },
      region: { name: 'North Sea' },
      subjects: [],
    } as never);
    const tools = buildCopilotTools(ctx);

    // Turn 1: ask for getFixture. Turn 2: plain answer (terminates).
    const model = scriptedModel([[toolCallPart('getFixture', { fixtureId: FIXTURE_ID })]]);
    const result = await runAgent(model, tools, 5);

    // The right tool ran (getFixture queried the fixture), not findMatches or any write tool.
    expect(vi.mocked(prisma.fixture.findFirst).mock.calls[0]?.[0]).toMatchObject({
      where: { id: FIXTURE_ID, brokerId: 'broker-1' },
    });
    expect(prisma.requirement.findUnique).not.toHaveBeenCalled();
    expect(advanceSpy).not.toHaveBeenCalled();
    expect(recapSpy).not.toHaveBeenCalled();
    expect(result.text).toBe('Done.');
  });
});

describe('copilot agent — bounded loop', () => {
  it('stops at the step cap even if the model keeps requesting a tool (no runaway)', async () => {
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      id: FIXTURE_ID,
      status: 'DRAFT',
      agreedDayRate: 1,
      currency: 'GBP',
      vessel: { name: 'V' },
      charterer: { name: 'C' },
      region: { name: 'R' },
      subjects: [],
    } as never);
    const tools = buildCopilotTools(ctx);

    // A model that ALWAYS asks for getFixture again — it would loop forever without the cap.
    const model = new MockLanguageModelV3({
      doGenerate: async () => genResult([toolCallPart('getFixture', { fixtureId: FIXTURE_ID })]),
    });

    const MAX_STEPS = 3;
    const result = await runAgent(model, tools, MAX_STEPS);

    // The loop terminated at the cap rather than running unbounded.
    expect(result.steps.length).toBeLessThanOrEqual(MAX_STEPS);
    expect(vi.mocked(prisma.fixture.findFirst).mock.calls.length).toBeLessThanOrEqual(MAX_STEPS);
  });
});

describe('copilot agent — confirm gate (no mutation without approval)', () => {
  it('does NOT execute the write tool when the model proposes it (only surfaces an approval request)', async () => {
    const tools = buildCopilotTools(ctx);
    // The model proposes advancing status. Because advanceFixtureStatus is needsApproval:true,
    // the loop must surface a tool-approval-request and STOP — never call the executor.
    const model = scriptedModel([
      [toolCallPart('advanceFixtureStatus', { fixtureId: FIXTURE_ID, toStatus: 'ON_SUBS' })],
    ]);

    const result = await runAgent(model, tools, 5);

    const approvalRequests = result.content.filter(
      (part) => part.type === 'tool-approval-request',
    );
    expect(approvalRequests.length).toBe(1);
    // The load-bearing assertion: nothing mutated.
    expect(advanceSpy).not.toHaveBeenCalled();
  });

  it('executes the write tool exactly once after the broker approves', async () => {
    advanceSpy.mockResolvedValue({
      ok: true,
      data: { fixtureId: FIXTURE_ID, fromStatus: 'NEGOTIATING', toStatus: 'ON_SUBS' },
    });
    const tools = buildCopilotTools(ctx);

    // Turn 1: propose the write -> approval request, no execution.
    const proposeModel = scriptedModel([
      [toolCallPart('advanceFixtureStatus', { fixtureId: FIXTURE_ID, toStatus: 'ON_SUBS' })],
    ]);
    const proposed = await generateText({
      model: proposeModel,
      tools,
      messages: [{ role: 'user', content: 'advance the fixture' }],
      stopWhen: stepCountIs(5),
    });
    expect(advanceSpy).not.toHaveBeenCalled();

    const approval = proposed.content.find((part) => part.type === 'tool-approval-request');
    if (approval === undefined) throw new Error('expected an approval request');

    // Replay the conversation with the broker's approval appended; the loop now runs execute once.
    const messages: ModelMessage[] = [
      { role: 'user', content: 'advance the fixture' },
      ...proposed.response.messages,
      {
        role: 'tool',
        content: [
          { type: 'tool-approval-response', approvalId: approval.approvalId, approved: true },
        ],
      },
    ];
    const finishModel = scriptedModel([[textPart('Status change applied.')]]);
    await generateText({ model: finishModel, tools, messages, stopWhen: stepCountIs(5) });

    // Executed exactly once, with the session brokerId (never a tool arg) and the proposed input.
    expect(advanceSpy).toHaveBeenCalledTimes(1);
    expect(advanceSpy).toHaveBeenCalledWith(ctx, FIXTURE_ID, 'ON_SUBS');
  });

  it('records a denial (and no execution) when the broker rejects', async () => {
    const tools = buildCopilotTools(ctx);
    const proposeModel = scriptedModel([
      [toolCallPart('advanceFixtureStatus', { fixtureId: FIXTURE_ID, toStatus: 'ON_SUBS' })],
    ]);
    const proposed = await generateText({
      model: proposeModel,
      tools,
      messages: [{ role: 'user', content: 'advance the fixture' }],
      stopWhen: stepCountIs(5),
    });
    const approval = proposed.content.find((part) => part.type === 'tool-approval-request');
    if (approval === undefined) throw new Error('expected an approval request');

    const messages: ModelMessage[] = [
      { role: 'user', content: 'advance the fixture' },
      ...proposed.response.messages,
      {
        role: 'tool',
        content: [
          { type: 'tool-approval-response', approvalId: approval.approvalId, approved: false },
        ],
      },
    ];
    const finishModel = scriptedModel([[textPart('Action rejected.')]]);
    await generateText({ model: finishModel, tools, messages, stopWhen: stepCountIs(5) });

    expect(advanceSpy).not.toHaveBeenCalled();
  });
});

describe('copilot agent — write rejection is relayed, never mutated', () => {
  it('relays an executor rejection after approval (the executor is the only DB chokepoint)', async () => {
    // The executor returns the subject-lift rejection (proven for real in the separate e2e file
    // and in advance-fixture-status.tool.test.ts). Here we assert the loop relays it without a
    // second execution attempt.
    advanceSpy.mockResolvedValue({
      ok: false,
      error: 'Cannot fix: every subject must be LIFTED or WAIVED (1 still unresolved)',
    });
    const tools = buildCopilotTools(ctx);

    const proposeModel = scriptedModel([
      [toolCallPart('advanceFixtureStatus', { fixtureId: FIXTURE_ID, toStatus: 'FIXED' })],
    ]);
    const proposed = await generateText({
      model: proposeModel,
      tools,
      messages: [{ role: 'user', content: 'fix it' }],
      stopWhen: stepCountIs(5),
    });
    const approval = proposed.content.find((part) => part.type === 'tool-approval-request');
    if (approval === undefined) throw new Error('expected an approval request');

    const messages: ModelMessage[] = [
      { role: 'user', content: 'fix it' },
      ...proposed.response.messages,
      {
        role: 'tool',
        content: [
          { type: 'tool-approval-response', approvalId: approval.approvalId, approved: true },
        ],
      },
    ];
    const finishModel = scriptedModel([[textPart('Cannot fix yet.')]]);
    await generateText({ model: finishModel, tools, messages, stopWhen: stepCountIs(5) });

    // The executor ran exactly once and returned a rejection — no retry, no mutation path beyond it.
    expect(advanceSpy).toHaveBeenCalledTimes(1);
    const outcome = await advanceSpy.mock.results[0]?.value;
    expect(outcome).toMatchObject({ ok: false });
  });
});
