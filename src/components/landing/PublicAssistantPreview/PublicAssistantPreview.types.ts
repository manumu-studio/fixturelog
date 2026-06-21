// PublicAssistantPreview.types.ts - contracts for the public limited assistant preview.
export interface PublicAssistantPreviewPrompt {
  readonly id: string;
  readonly label: string;
}

export interface PublicAssistantPreviewProps {
  readonly prompts: readonly PublicAssistantPreviewPrompt[];
}

export type PublicAssistantPreviewStatus = 'idle' | 'loading' | 'answered' | 'error';

export interface UsePublicAssistantPreviewResult {
  readonly activePromptId: string | null;
  readonly answer: string;
  readonly status: PublicAssistantPreviewStatus;
  readonly ask: (promptId: string) => void;
}
