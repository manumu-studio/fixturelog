// route.ts — public assistant preview endpoint.
// Two public-safe paths, no broker data/tools/writes/voice:
//   - { promptId }  → deterministic curated answer (the landing buttons). No LLM, no rate limit.
//   - { question }  → free-text. When JUNIOR_LLM_DEMO is on, a rate-guarded, grounded Claude answer
//                     (SPEC-004); otherwise a deterministic preview fallback. Degrades gracefully —
//                     never 500, and falls back to a safe preview message on any model failure.
import { z } from 'zod';
import { serverEnv } from '@/lib/env.server';
import { resolvePublicAssistantPreview } from '@/lib/public-assistant/public-assistant-preview';
import { answerJuniorQuestion } from '@/lib/public-assistant/junior-assistant-llm';
import {
  checkJuniorRateLimit,
  JUNIOR_COOKIE_LIMIT,
  JUNIOR_IP_LIMIT,
  JUNIOR_WINDOW_MS,
} from '@/lib/public-assistant/junior-rate-guard';

const PromptBody = z.object({ promptId: z.string().min(1).max(80) });
const QuestionBody = z.object({ question: z.string().trim().min(1).max(300) });

const COOKIE_NAME = 'ja_demo_id';

// Safe, generic preview answer used when the demo is off or the model call fails.
const PREVIEW_FALLBACK =
  'I can only preview what FixtureLog is publicly building right now — a private service for brokers ' +
  'and charterers, with two supervised junior assistants for chartering and matching. The full ' +
  'workspace stays private while the service is prepared.';

function readVisitorId(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (cookie === null) return null;
  const entry = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry === undefined ? null : entry.slice(COOKIE_NAME.length + 1);
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded === null) return 'unknown';
  const first = forwarded.split(',')[0]?.trim();
  return first === undefined || first.length === 0 ? 'unknown' : first;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ mode: 'preview', error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Curated prompt button → deterministic, no LLM, no rate limit.
  const promptParsed = PromptBody.safeParse(body);
  if (promptParsed.success) {
    const result = resolvePublicAssistantPreview(promptParsed.data.promptId);
    return Response.json(result.body, { status: result.status });
  }

  // Free-text question.
  const questionParsed = QuestionBody.safeParse(body);
  if (!questionParsed.success) {
    return Response.json(
      { mode: 'preview', error: 'Expected a promptId or a question (1–300 characters).' },
      { status: 400 },
    );
  }

  // Demo off → deterministic preview fallback (no LLM, no rate limit).
  if (!serverEnv.JUNIOR_LLM_DEMO) {
    return Response.json({ mode: 'preview', answer: PREVIEW_FALLBACK }, { status: 200 });
  }

  // Identify the visitor (existing cookie, or a fresh id set on the response).
  const existingId = readVisitorId(request);
  const visitorId = existingId ?? crypto.randomUUID();
  const rate = checkJuniorRateLimit([
    { key: `c:${visitorId}`, limit: JUNIOR_COOKIE_LIMIT },
    { key: `ip:${clientIp(request)}`, limit: JUNIOR_IP_LIMIT },
  ]);

  const headers = new Headers({ 'content-type': 'application/json' });
  if (existingId === null) {
    const maxAgeSec = Math.floor(JUNIOR_WINDOW_MS / 1000);
    headers.append(
      'set-cookie',
      `${COOKIE_NAME}=${visitorId}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`,
    );
  }

  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ mode: 'preview', error: 'preview_limit_reached', retryAfter: rate.retryAfterSec }),
      { status: 429, headers },
    );
  }

  const llm = await answerJuniorQuestion(questionParsed.data.question);
  const answer = llm.ok ? llm.answer : PREVIEW_FALLBACK;
  return new Response(
    JSON.stringify({ mode: 'preview', answer, remaining: rate.remaining }),
    { status: 200, headers },
  );
}
