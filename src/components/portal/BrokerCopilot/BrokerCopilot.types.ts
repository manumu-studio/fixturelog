// BrokerCopilot.types.ts — props + view types for the broker copilot panel. The chat message
// type is re-exported from the AI SDK so the boundary stays typed; the panel itself takes no
// data props (it owns its own chat state via useChat).
import type { UIMessage } from 'ai';

export type CopilotMessage = UIMessage;

export interface BrokerCopilotProps {
  // Endpoint the chat posts to. Defaults to the broker copilot route; overridable for tests.
  apiPath?: string;
}
