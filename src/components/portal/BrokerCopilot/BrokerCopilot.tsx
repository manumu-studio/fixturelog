// BrokerCopilot.tsx — collapsible chat panel for the broker dashboard. The broker asks about the
// desk's queue and the answer is grounded server-side. v2 is a tool-using agent: read-tool steps
// render as short status lines, and any proposed WRITE renders as a card with Approve / Reject.
// Approve replays the AI SDK approval so the route's gated tool executes; Reject denies it —
// nothing mutates without an explicit Approve. Controls are disabled while a turn is in flight,
// errors render inline, and an unrecognised tool part degrades to "not shown" rather than crashing.
// UI only: all grounding + safety lives in the /api/broker/copilot route. Token-only styling.
'use client';

import { useBrokerCopilot } from './useBrokerCopilot';
import { messageToViewItems } from './copilot-parts';
import type {
  BrokerCopilotProps,
  CopilotApprovalDecision,
  CopilotMessage,
  CopilotProposalItem,
  CopilotViewItem,
} from './BrokerCopilot.types';
import styles from './BrokerCopilot.module.css';

// Proposed-write card: plain-language summary + Approve / Reject. Both buttons are disabled while
// a turn is in flight so the broker cannot double-submit an approval. Approve executes the gated
// tool on the route; Reject denies it and nothing mutates.
function ProposalCard({
  item,
  decide,
  disabled,
}: {
  item: CopilotProposalItem;
  decide: CopilotApprovalDecision;
  disabled: boolean;
}) {
  return (
    <div className={styles.proposal} role="group" aria-label="Proposed action">
      <p className={styles.proposalText}>{item.summary}</p>
      <div className={styles.proposalActions}>
        <button
          type="button"
          className={styles.approve}
          onClick={() => decide(item.approvalId, true)}
          disabled={disabled}
        >
          Approve
        </button>
        <button
          type="button"
          className={styles.reject}
          onClick={() => decide(item.approvalId, false)}
          disabled={disabled}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// Render one flattened view item: a text bubble, a tool status line, or the proposal card.
function ViewItem({
  item,
  role,
  decide,
  disabled,
}: {
  item: CopilotViewItem;
  role: CopilotMessage['role'];
  decide: CopilotApprovalDecision;
  disabled: boolean;
}) {
  if (item.kind === 'proposal') {
    return <ProposalCard item={item} decide={decide} disabled={disabled} />;
  }
  if (item.kind === 'tool') {
    return <p className={styles.toolStep}>{item.text}</p>;
  }
  const rowClass = role === 'user' ? styles.userRow : styles.assistantRow;
  return (
    <div className={rowClass}>
      <span className={styles.bubble}>{item.text}</span>
    </div>
  );
}

// Render the whole transcript: each message expands into its ordered view items.
function MessageList({
  messages,
  decide,
  disabled,
}: {
  messages: CopilotMessage[];
  decide: CopilotApprovalDecision;
  disabled: boolean;
}) {
  return (
    <div className={styles.messages}>
      {messages.map((message) =>
        messageToViewItems(message).map((item) => (
          <ViewItem
            key={item.id}
            item={item}
            role={message.role}
            decide={decide}
            disabled={disabled}
          />
        )),
      )}
    </div>
  );
}

export function BrokerCopilot({ apiPath }: BrokerCopilotProps) {
  const { open, toggleOpen, messages, input, setInput, submit, decide, isStreaming, error } =
    useBrokerCopilot(apiPath);

  return (
    <section className={styles.root} aria-label="Broker copilot">
      <button type="button" className={styles.header} onClick={toggleOpen} aria-expanded={open}>
        <span className={styles.title}>Copilot</span>
        <span className={styles.hint}>{open ? 'Hide' : "Ask about the desk's deals"}</span>
      </button>

      {open && (
        <div className={styles.body}>
          {messages.length === 0 ? (
            <p className={styles.empty}>
              Ask about the desk&apos;s deals — open enquiries, fixtures in progress, or what
              needs a decision today. Answers come only from the desk&apos;s current data.
            </p>
          ) : (
            <MessageList messages={messages} decide={decide} disabled={isStreaming} />
          )}

          {error !== undefined && (
            <p className={styles.error} role="alert">
              Something went wrong. Please try again.
            </p>
          )}

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the desk's deals…"
              aria-label="Message the copilot"
              disabled={isStreaming}
            />
            <button
              type="submit"
              className={styles.send}
              disabled={isStreaming || input.trim().length === 0}
            >
              {isStreaming ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
