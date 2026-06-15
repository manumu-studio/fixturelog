// BrokerCopilot.types.ts — props + view types for the broker copilot panel. The chat message
// type is re-exported from the AI SDK so the transport boundary stays typed. The CopilotViewItem
// discriminated union is the panel's own render model: copilot-parts.ts flattens each UI message's
// parts into these items, and BrokerCopilot.tsx renders one element per item. Keeping the render
// model separate from the SDK part union means the component never touches SDK internals directly.
import type { UIMessage } from 'ai';

export type CopilotMessage = UIMessage;

export interface BrokerCopilotProps {
  // Endpoint the chat posts to. Defaults to the broker copilot route; overridable for tests.
  apiPath?: string;
}

// A plain text segment of an assistant or user turn.
export interface CopilotTextItem {
  kind: 'text';
  id: string;
  text: string;
}

// A completed/in-progress tool step rendered as a short status line (read results, applied
// writes, relayed rejections, failures).
export interface CopilotToolItem {
  kind: 'tool';
  id: string;
  text: string;
}

// A proposed WRITE awaiting the broker's decision. `approvalId` is the AI SDK approval id the
// panel passes to addToolApprovalResponse on Approve/Reject; `summary` is the plain-language ask.
export interface CopilotProposalItem {
  kind: 'proposal';
  id: string;
  approvalId: string;
  summary: string;
}

// Discriminated union of everything the panel renders for one message.
export type CopilotViewItem = CopilotTextItem | CopilotToolItem | CopilotProposalItem;

// Decision the broker takes on a proposed write. The panel calls this; the hook forwards it to
// useChat.addToolApprovalResponse so the route's gated tool either executes or is denied.
export type CopilotApprovalDecision = (approvalId: string, approved: boolean) => void;
