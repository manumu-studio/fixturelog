// route.ts - public deterministic assistant preview endpoint.
import { z } from 'zod';
import { resolvePublicAssistantPreview } from '@/lib/public-assistant/public-assistant-preview';

const RequestBodySchema = z.object({
  promptId: z.string().min(1).max(80),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ mode: 'preview', error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ mode: 'preview', error: 'Expected a promptId.' }, { status: 400 });
  }

  const result = resolvePublicAssistantPreview(parsed.data.promptId);
  return Response.json(result.body, { status: result.status });
}
