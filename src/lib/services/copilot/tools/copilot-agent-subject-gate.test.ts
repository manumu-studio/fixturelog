// copilot-agent-subject-gate.test.ts — end-to-end proof that the subject-lift gate still blocks an
// illegal ON_SUBS -> FIXED when the write is approved THROUGH the agent loop. Unlike the unit suite
// (copilot-agent.test.ts), this wires the REAL executor and the REAL fixture-status-policy; only
// Prisma is stubbed. The fixture has a PENDING subject, so the policy must reject the FIX and the
// transaction must never run — even though the broker approved the proposed write.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateText,
  stepCountIs,
  type ModelMessage,
} from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import type {
  LanguageModelV3Content,
  LanguageModelV3GenerateResult,
} from '@ai-sdk/provider';

// Prisma is the only stubbed dependency — evaluateTransition (the gate) runs for real.
const txStub = {
  fixture: { update: vi.fn() },
  fixtureStatusChange: { create: vi.fn() },
  requirement: { update: vi.fn() },
};
vi.mock('@/lib/prisma', () => ({
  prisma: {
    fixture: { findFirst: vi.fn() },
    $transaction: vi.fn((cb: (tx: typeof txStub) => Promise<unknown>) => cb(txStub)),
  },
}));

import { prisma } from '@/lib/prisma';
import { buildCopilotTools } from './build-copilot-tools';

const ctx = { brokerId: 'broker-1' } as const;
const FIXTURE_ID = 'clxxxxxxxxxxxxxxxxxxxxxx01';

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

function scriptedModel(turns: LanguageModelV3Content[][]): MockLanguageModelV3 {
  let turn = 0;
  return new MockLanguageModelV3({
    doGenerate: async () => {
      const content = turns[turn] ?? [{ type: 'text', text: 'Done.' }];
      turn += 1;
      return genResult(content);
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('copilot agent — subject-lift gate (real executor + real policy)', () => {
  it('blocks an approved ON_SUBS -> FIXED while a subject is still PENDING — no DB write', async () => {
    // ON_SUBS fixture with one unresolved subject: the policy must reject FIXED.
    vi.mocked(prisma.fixture.findFirst).mockResolvedValue({
      status: 'ON_SUBS',
      requirementId: null,
      subjects: [{ status: 'PENDING' }],
    } as never);

    const tools = buildCopilotTools(ctx);

    // Turn 1: the model proposes the (illegal) FIX. needsApproval pauses execution.
    const proposeModel = scriptedModel([
      [{ type: 'tool-call', toolCallId: 'c1', toolName: 'advanceFixtureStatus', input: JSON.stringify({ fixtureId: FIXTURE_ID, toStatus: 'FIXED' }) }],
    ]);
    const proposed = await generateText({
      model: proposeModel,
      tools,
      messages: [{ role: 'user', content: 'fix it' }],
      stopWhen: stepCountIs(5),
    });

    // Nothing has touched the DB yet — only an approval request exists.
    expect(prisma.fixture.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    const approval = proposed.content.find((part) => part.type === 'tool-approval-request');
    if (approval === undefined) throw new Error('expected an approval request');

    // The broker approves — but the executor's real policy check must still reject the FIX.
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
    const finishModel = scriptedModel([[{ type: 'text', text: 'Cannot fix yet.' }]]);
    await generateText({ model: finishModel, tools, messages, stopWhen: stepCountIs(5) });

    // The executor read the fixture to evaluate the gate, but the gate rejected the FIX:
    // the transaction (the only DB write) never ran.
    expect(prisma.fixture.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(txStub.fixture.update).not.toHaveBeenCalled();
    expect(txStub.fixtureStatusChange.create).not.toHaveBeenCalled();
  });
});
