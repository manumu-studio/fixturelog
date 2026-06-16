// POST /api/broker/copilot — the AI Broker Copilot endpoint. Broker-only (charterer → 403,
// anonymous → 401, both via requireBrokerApi). It grounds Claude in the desk's REAL data:
// it loads the same broker-wide dashboard aggregate the dashboard page uses, renders it into a
// compact text block, and injects that as the source of truth in the system prompt. The safety
// rules (answer only from the data + tool results, say "I don't have that", never invent
// vessels/deals/rates/numbers, stay in domain) live entirely in the system prompt.
//
// v2 is a bounded tool-using agent. It runs a multi-step loop (capped via stopWhen/stepCountIs)
// over the broker-scoped tools: READ tools (getFixture, findMatches) auto-execute within
// the loop; WRITE tools (advanceFixtureStatus, generateRecap) are approval-gated — they surface a
// proposed action and only mutate after the broker explicitly approves (AI SDK v6 needsApproval
// human-in-the-loop). brokerId comes from the session guard, never the body, so the model can
// never spoof which desk it acts on; the status policy + subject-lift gate still block illegal
// writes even once approved.
import { createAnthropic } from '@ai-sdk/anthropic';
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  validateUIMessages,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { serverEnv } from '@/lib/env.server';
import { getBrokerDashboard } from '@/lib/services/portal/broker-queries';
import { buildBrokerDataSummary } from '@/lib/services/copilot/broker-data-summary';
import { buildCopilotSystemPrompt } from '@/lib/services/copilot/copilot-prompt';
import { buildCopilotTools } from '@/lib/services/copilot/tools';

// Cap the streaming response duration (Vercel function budget for the LLM call).
export const maxDuration = 30;

// A fast, low-cost Claude model is the right fit for a grounded, tool-using chat. If this id
// ever errors, swap it for another current Claude id (e.g. 'claude-sonnet-4-6').
const COPILOT_MODEL = 'claude-haiku-4-5';

// Bound the agent loop so it can never run away: at most this many steps (LLM call + tool
// results count as steps). stepCountIs stops the loop once this many steps complete.
const MAX_AGENT_STEPS = 5;

// Cheap abuse caps so an authenticated session cannot push an unbounded history into a billed
// model call. maxDuration caps wall-clock, not token spend — these caps gate spend up front.
const MAX_MESSAGES = 50;
const MAX_TOTAL_CHARS = 20_000;

// Request-body schema for the useChat transport: a non-empty, bounded array of UI messages. The
// message SHAPE is validated structurally by validateUIMessages below; here we gate the
// envelope and reject oversized histories before any model call.
const RequestBodySchema = z.object({
  messages: z.array(z.unknown()).min(1).max(MAX_MESSAGES),
});

// Total characters across all text parts of the validated UI messages. Used to reject overlong
// histories cheaply, before the model is invoked.
function totalMessageChars(messages: UIMessage[]): number {
  return messages.reduce((sum, message) => {
    const parts = message.parts ?? [];
    return sum + parts.reduce(
      (partSum, part) => partSum + (part.type === 'text' ? part.text.length : 0),
      0,
    );
  }, 0);
}

export async function POST(request: Request): Promise<Response> {
  // 1. Broker-only gate. brokerId comes from the provisioned session, never the body.
  const guard = await requireBrokerApi();
  if (!guard.ok) return guard.response;

  // 2. Validate the request body at the fetch boundary (Zod envelope + AI SDK message shape).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: `Expected 1–${MAX_MESSAGES} messages.` },
      { status: 400 },
    );
  }
  let messages: UIMessage[];
  try {
    messages = await validateUIMessages({ messages: parsed.data.messages });
  } catch {
    return Response.json({ error: 'Malformed chat messages.' }, { status: 400 });
  }
  // Reject overlong histories before paying for a model call.
  if (totalMessageChars(messages) > MAX_TOTAL_CHARS) {
    return Response.json(
      { error: `Conversation too long (limit ${MAX_TOTAL_CHARS} characters).` },
      { status: 400 },
    );
  }

  // 3. Ground the model in the desk's current data → compact summary → system prompt.
  const dashboard = await getBrokerDashboard();
  const system = buildCopilotSystemPrompt(buildBrokerDataSummary(dashboard));

  // 4. Build the broker-scoped toolset from the session brokerId (never the body). Read tools
  //    auto-execute; write tools are approval-gated (proposed action → broker approval → mutate).
  const tools = buildCopilotTools({ brokerId: guard.ctx.brokerId });

  // 5. Stream the answer as a bounded tool-using agent. stopWhen caps the loop so it cannot run
  //    away; convertToModelMessages turns the UI messages (including any tool-approval responses)
  //    into model messages; the response streams back in the UI-message format useChat consumes.
  //    abortSignal stops token spend if the broker navigates away mid-stream.
  const anthropic = createAnthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
  const result = streamText({
    model: anthropic(COPILOT_MODEL),
    system,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
    abortSignal: request.signal,
  });

  return result.toUIMessageStreamResponse();
}
