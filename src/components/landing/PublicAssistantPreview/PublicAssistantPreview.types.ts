// PublicAssistantPreview.types.ts - contracts for the public limited assistant preview.
export interface PublicAssistantPreviewPrompt {
  readonly id: string;
  readonly label: string;
}

export interface PublicAssistantPreviewProps {
  readonly prompts: readonly PublicAssistantPreviewPrompt[];
}

export type PublicAssistantPreviewStatus = 'idle' | 'loading' | 'answered' | 'error' | 'blocked';

export interface UsePublicAssistantPreviewResult {
  readonly activePromptId: string | null;
  readonly answer: string;
  readonly status: PublicAssistantPreviewStatus;
  // Preview questions left this window (LLM path only); null for curated prompts / before any ask.
  readonly remaining: number | null;
  readonly ask: (promptId: string) => void;
  readonly askQuestion: (question: string) => void;
}
