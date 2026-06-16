// copilot-parts.ts — pure, view-layer classifier that turns an AI SDK v6 UI message into a flat
// list of render items the BrokerCopilot panel can display directly. It maps text parts to text
// items, READ-tool steps (getFixture, findMatches) to short status lines, and a proposed WRITE
// (advanceFixtureStatus, generateRecap in the `approval-requested` state) to a proposal card with
// the approvalId the panel passes back to useChat.addToolApprovalResponse. Tool output/errors are
// summarised into plain lines. Every value read off a part is `unknown` at this boundary, so we
// narrow with the AI SDK type guards plus Zod — no `any`, no `as`, never throws on a bad part.
import { getToolName, isToolUIPart, type DynamicToolUIPart, type ToolUIPart, type UITools } from 'ai';
import { z } from 'zod';
import type { CopilotMessage, CopilotViewItem } from './BrokerCopilot.types';

// The narrowed shape isToolUIPart guarantees: a static tool part or a dynamic-tool part. We read
// its state-specific fields defensively below, so the panel never trusts a field that may be absent.
type AnyToolUIPart = ToolUIPart<UITools> | DynamicToolUIPart;

// The flat bag of fields the renderer needs, narrowed off a tool part without `as`.
interface ToolPartShape {
  id: string;
  toolName: string;
  state: string;
  input: unknown;
  output: unknown;
  errorText: string | undefined;
  approvalId: string | undefined;
}

// A UI message part is `unknown`-shaped at the edge of the SDK's discriminated union, so we re-
// validate the bits we render with Zod rather than trusting the inferred type. These mirror the
// tool input/output schemas without importing the server-only tool module into the client bundle.
const AdvanceInputSchema = z.object({
  fixtureId: z.string(),
  toStatus: z.enum(['DRAFT', 'NEGOTIATING', 'ON_SUBS', 'FIXED', 'COMPLETED', 'FAILED']),
});

const RecapInputSchema = z.object({ fixtureId: z.string() });

// The broker-scoped executors return this discriminated outcome; a rejected/illegal write comes
// back as { ok: false, error } rather than throwing, so the panel can show it as a line.
const ToolOutcomeSchema = z.union([
  z.object({ ok: z.literal(true), data: z.unknown() }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

const FindMatchesDataSchema = z.object({ shortlist: z.array(z.unknown()) });
const GetFixtureDataSchema = z.object({ vesselName: z.string(), status: z.string() });

// Human labels for the two read tools, used to render their step lines.
const READ_TOOL_LABEL: Readonly<Record<string, string>> = {
  getFixture: 'Looked up fixture',
  findMatches: 'Ran vessel match',
};

// Plain-language proposal summary for a WRITE awaiting approval. Built from the validated tool
// input so the broker reads what will happen before approving — e.g. "Propose: advance this
// fixture to FIXED. Approve?".
function proposalSummary(toolName: string, input: unknown): string {
  if (toolName === 'advanceFixtureStatus') {
    const parsed = AdvanceInputSchema.safeParse(input);
    if (parsed.success) {
      return `Propose: advance this fixture to ${parsed.data.toStatus}. Approve?`;
    }
  }
  if (toolName === 'generateRecap') {
    const parsed = RecapInputSchema.safeParse(input);
    if (parsed.success) {
      return 'Propose: generate a SUPPLYTIME 2017 recap for this fixture. Approve?';
    }
  }
  return 'Propose: run this action. Approve?';
}

// Short, readable line for a completed READ-tool step. Falls back to a generic line if the
// payload does not match the expected shape (defensive — never throw on a surprising output).
function readResultLine(toolName: string, output: unknown): string {
  const label = READ_TOOL_LABEL[toolName] ?? 'Tool';
  const outcome = ToolOutcomeSchema.safeParse(output);
  if (!outcome.success) return `${label}: done`;
  if (!outcome.data.ok) return `${label}: ${outcome.data.error}`;

  if (toolName === 'findMatches') {
    const data = FindMatchesDataSchema.safeParse(outcome.data.data);
    if (data.success) return `Ran match: ${data.data.shortlist.length} vessels`;
  }
  if (toolName === 'getFixture') {
    const data = GetFixtureDataSchema.safeParse(outcome.data.data);
    if (data.success) return `Looked up ${data.data.vesselName} (${data.data.status})`;
  }
  return `${label}: done`;
}

// Map one completed WRITE-tool result to a line ("Status advanced to FIXED." / a relayed
// rejection). Returns null when the output is not yet present so the caller can skip it.
function writeResultLine(toolName: string, output: unknown): string | null {
  const outcome = ToolOutcomeSchema.safeParse(output);
  if (!outcome.success) return null;
  if (!outcome.data.ok) return `Action rejected: ${outcome.data.error}`;
  if (toolName === 'generateRecap') return 'Recap generated.';
  return 'Status change applied.';
}

// Build the render item for a single tool part, given its narrowed name + state. Returns null for
// transient states (input-streaming) that need no visible line, so the caller filters them out.
function toolPartToItem(part: ToolPartShape): CopilotViewItem | null {
  const { id, toolName, state, input, output, errorText, approvalId } = part;
  const isWrite = toolName === 'advanceFixtureStatus' || toolName === 'generateRecap';

  if (state === 'approval-requested' && approvalId !== undefined) {
    return { kind: 'proposal', id, approvalId, summary: proposalSummary(toolName, input) };
  }
  if (state === 'approval-responded') {
    return { kind: 'tool', id, text: 'Working…' };
  }
  if (state === 'output-denied') {
    return { kind: 'tool', id, text: 'Action rejected.' };
  }
  if (state === 'output-error') {
    return { kind: 'tool', id, text: `Tool failed: ${errorText ?? 'unknown error'}` };
  }
  if (state === 'output-available') {
    const text = isWrite ? writeResultLine(toolName, output) : readResultLine(toolName, output);
    return text === null ? null : { kind: 'tool', id, text };
  }
  if (state === 'input-available' && !isWrite) {
    return { kind: 'tool', id, text: `${READ_TOOL_LABEL[toolName] ?? 'Tool'}: running…` };
  }
  return null;
}

// Narrow a tool UI part into the plain bag of fields we render, reading optional state-specific
// fields off the part without `as`. `approval` only exists in the approval-* states; `output`/
// `errorText` only in the output-* states — accessing them via `in`/optional chaining is safe.
function toolPartShape(part: AnyToolUIPart): ToolPartShape {
  const toolName = getToolName(part);
  const approvalId =
    'approval' in part && part.approval !== undefined ? part.approval.id : undefined;
  const output = 'output' in part ? part.output : undefined;
  const errorText = 'errorText' in part ? part.errorText : undefined;
  const input = 'input' in part ? part.input : undefined;
  return {
    id: `${part.toolCallId}-${part.state}`,
    toolName,
    state: part.state,
    input,
    output,
    errorText,
    approvalId,
  };
}

// Flatten a message's parts into the ordered list of render items. Unknown part kinds are
// skipped (never thrown on), so a future SDK part type degrades to "not shown" rather than a crash.
export function messageToViewItems(message: CopilotMessage): CopilotViewItem[] {
  const items: CopilotViewItem[] = [];
  message.parts.forEach((part, index) => {
    if (part.type === 'text') {
      if (part.text.length > 0) items.push({ kind: 'text', id: `${message.id}-t${index}`, text: part.text });
      return;
    }
    if (isToolUIPart(part)) {
      const item = toolPartToItem(toolPartShape(part));
      if (item !== null) items.push(item);
    }
  });
  return items;
}
