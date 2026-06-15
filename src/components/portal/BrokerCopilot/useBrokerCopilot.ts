// useBrokerCopilot.ts — chat state + collapse state for the broker copilot panel. Wraps the
// AI SDK useChat hook (pointed at the broker copilot route via DefaultChatTransport) and owns
// the input string and the open/closed toggle. useChat (v6) no longer manages input, so we do.
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useState } from 'react';
import type { CopilotMessage } from './BrokerCopilot.types';

const DEFAULT_API_PATH = '/api/broker/copilot';

interface UseBrokerCopilotResult {
  open: boolean;
  toggleOpen: () => void;
  messages: CopilotMessage[];
  input: string;
  setInput: (value: string) => void;
  submit: () => void;
  isStreaming: boolean;
  error: Error | undefined;
}

export function useBrokerCopilot(apiPath: string = DEFAULT_API_PATH): UseBrokerCopilotResult {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  // The transport is stable per apiPath so useChat doesn't re-create its connection each render.
  const transport = useMemo(() => new DefaultChatTransport({ api: apiPath }), [apiPath]);
  const { messages, sendMessage, status, error } = useChat<CopilotMessage>({ transport });

  const isStreaming = status === 'submitted' || status === 'streaming';

  // Send the trimmed input and clear the box. Guarded so we never post empty turns or stack a
  // second request while one is in flight.
  function submit(): void {
    const text = input.trim();
    if (text.length === 0 || isStreaming) return;
    void sendMessage({ text });
    setInput('');
  }

  function toggleOpen(): void {
    setOpen((prev) => !prev);
  }

  return { open, toggleOpen, messages, input, setInput, submit, isStreaming, error };
}
