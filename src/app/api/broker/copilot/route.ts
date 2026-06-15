// POST /api/broker/copilot — the AI Broker Copilot endpoint. Broker-only (charterer → 403,
// anonymous → 401, both via requireBrokerApi). It grounds Claude in the desk's REAL data:
// it loads the same broker-wide dashboard aggregate the dashboard page uses, renders it into a
// compact text block, and injects that as the ONLY source of truth in the system prompt. The
// safety rules (answer only from the data, say "I don't have that", never invent
// vessels/deals/rates/numbers, stay in domain) live entirely in the system prompt. v1 is
// deliberately tool-free: streaming chat over an injected summary — simple and reliable.
import { createAnthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, validateUIMessages, type UIMessage } from 'ai';
import { z } from 'zod';
import { requireBrokerApi } from '@/lib/auth/require-broker';
import { serverEnv } from '@/lib/env.server';
import { getBrokerDashboard } from '@/lib/services/portal/broker-queries';
import { buildBrokerDataSummary } from '@/lib/services/copilot/broker-data-summary';
import { buildCopilotSystemPrompt } from '@/lib/services/copilot/copilot-prompt';

// Cap the streaming response duration (Vercel function budget for the LLM call).
export const maxDuration = 30;

// A fast, low-cost Claude model is the right fit for a grounded, summary-only chat. If this id
// ever errors, swap it for another current Claude id (e.g. 'claude-sonnet-4-6').
const COPILOT_MODEL = 'claude-haiku-4-5';

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

  // 4. Stream the answer. The provider reads ANTHROPIC_API_KEY via the validated server env;
  //    convertToModelMessages turns the UI messages into model messages; the response streams
  //    back in the UI-message format useChat consumes. abortSignal stops token spend if the
  //    broker navigates away mid-stream.
  const anthropic = createAnthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
  const result = streamText({
    model: anthropic(COPILOT_MODEL),
    system,
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
  });

  return result.toUIMessageStreamResponse();
}
