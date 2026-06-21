// public-assistant-preview.ts - deterministic public-safe assistant preview answers.

export const PUBLIC_ASSISTANT_PROMPT_IDS = [
  'what-building',
  'broker-help',
  'matching-help',
  'why-private',
] as const;

export type PublicAssistantPromptId = (typeof PUBLIC_ASSISTANT_PROMPT_IDS)[number];

export interface PublicAssistantPreviewAnswer {
  readonly answer: string;
  readonly mode: 'preview';
}

export interface PublicAssistantPreviewError {
  readonly error: string;
  readonly mode: 'preview';
}

export type PublicAssistantPreviewResult =
  | { readonly ok: true; readonly status: 200; readonly body: PublicAssistantPreviewAnswer }
  | { readonly ok: false; readonly status: 400; readonly body: PublicAssistantPreviewError };

// Approved public context only. Warm and human, but always preview-only:
// it speaks from a trusted evidence layer and never claims to be the live broker workspace.
const PUBLIC_ASSISTANT_ANSWERS: Record<PublicAssistantPromptId, PublicAssistantPreviewAnswer> = {
  'what-building': {
    mode: 'preview',
    answer:
      "FixtureLog is quietly building a private service for brokers and charterers. For now I'm just a preview of the assistant being shaped on top of a trusted evidence layer, so this page stays calm and closed while the real workspace is built with care.",
  },
  'broker-help': {
    mode: 'preview',
    answer:
      'The chartering assistant is being shaped to help a broker with intake, follow-ups, and clean handoffs, always reading from a supervised evidence layer. Think of me as a careful junior, not an autonomous broker, with a person kept in the loop for anything that matters.',
  },
  'matching-help': {
    mode: 'preview',
    answer:
      "The matching assistant is being shaped to explain why a vessel fits, what sits behind a shortlist, and the evidence under each recommendation. It reads from the same trusted evidence layer rather than exposing any live matching tools on this public page.",
  },
  'why-private': {
    mode: 'preview',
    answer:
      'Access stays private because the full broker workspace carries real operational work that deserves supervision. FixtureLog is keeping this page warm but closed, letting me preview only what the evidence layer can safely share until the service is ready.',
  },
};

function isPublicAssistantPromptId(promptId: string): promptId is PublicAssistantPromptId {
  return PUBLIC_ASSISTANT_PROMPT_IDS.some((knownPromptId) => knownPromptId === promptId);
}

export function resolvePublicAssistantPreview(promptId: string): PublicAssistantPreviewResult {
  if (!isPublicAssistantPromptId(promptId)) {
    return {
      ok: false,
      status: 400,
      body: {
        mode: 'preview',
        error:
          'I can only answer approved public preview prompts. The full broker workspace stays private behind a supervised evidence layer.',
      },
    };
  }

  return { ok: true, status: 200, body: PUBLIC_ASSISTANT_ANSWERS[promptId] };
}
