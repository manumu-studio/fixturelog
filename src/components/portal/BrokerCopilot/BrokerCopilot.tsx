// BrokerCopilot.tsx — collapsible chat panel for the broker dashboard. The broker asks about
// the desk's queue ("which fixtures have open subjects?", "what needs a decision today?") and
// the answer is grounded server-side in the desk's current data. UI only: all grounding +
// safety lives in the /api/broker/copilot route's system prompt. Token-only styling (--fl-*).
'use client';

import { useBrokerCopilot } from './useBrokerCopilot';
import type { BrokerCopilotProps, CopilotMessage } from './BrokerCopilot.types';
import styles from './BrokerCopilot.module.css';

// Join the text parts of a UI message into a single string (v6 messages are part arrays).
function messageText(message: CopilotMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

function MessageList({ messages }: { messages: CopilotMessage[] }) {
  return (
    <ul className={styles.messages}>
      {messages.map((message) => (
        <li
          key={message.id}
          className={message.role === 'user' ? styles.userRow : styles.assistantRow}
        >
          <span className={styles.bubble}>{messageText(message)}</span>
        </li>
      ))}
    </ul>
  );
}

export function BrokerCopilot({ apiPath }: BrokerCopilotProps) {
  const { open, toggleOpen, messages, input, setInput, submit, isStreaming, error } =
    useBrokerCopilot(apiPath);

  return (
    <section className={styles.root} aria-label="Broker copilot">
      <button
        type="button"
        className={styles.header}
        onClick={toggleOpen}
        aria-expanded={open}
      >
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
            <MessageList messages={messages} />
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
