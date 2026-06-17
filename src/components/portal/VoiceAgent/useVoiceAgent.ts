// useVoiceAgent.ts - connection state + token fetch for the broker voice panel. On connect it POSTs
// to the host-supplied token endpoint, Zod-parses the `{ serverUrl, token }` response (never trusting
// the shape of external data), and flips status so the LiveKitRoom mounts. It owns the connect /
// disconnect lifecycle and relays the room's connected / disconnected / error callbacks into a single
// status the component renders. No keys touch the client: the server mints the token from the session.
'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';
import type { UseVoiceAgentResult, VoiceConnectionStatus } from './VoiceAgent.types';

// The token route's response, validated at the fetch boundary.
const TokenResponseSchema = z.object({
  serverUrl: z.string().url(),
  token: z.string().min(1),
});

export function useVoiceAgent(tokenEndpoint: string): UseVoiceAgentResult {
  const [status, setStatus] = useState<VoiceConnectionStatus>('idle');
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Fetch a fresh token, then hand serverUrl + token to the room (which connects on mount).
  const connect = useCallback(() => {
    setErrorMessage(undefined);
    setStatus('requesting-token');
    void (async () => {
      try {
        const res = await fetch(tokenEndpoint, { method: 'POST' });
        if (!res.ok) {
          throw new Error(`Token request failed (${res.status}).`);
        }
        const data = TokenResponseSchema.parse(await res.json());
        setServerUrl(data.serverUrl);
        setToken(data.token);
        setStatus('connecting');
      } catch {
        setStatus('error');
        setErrorMessage('Could not start the voice session. Please try again.');
      }
    })();
  }, [tokenEndpoint]);

  // Tear down: drop the credentials so LiveKitRoom unmounts and the mic is released.
  const disconnect = useCallback(() => {
    setServerUrl(undefined);
    setToken(undefined);
    setStatus('idle');
    setErrorMessage(undefined);
  }, []);

  const onRoomConnected = useCallback(() => setStatus('connected'), []);

  const onRoomDisconnected = useCallback(() => {
    setServerUrl(undefined);
    setToken(undefined);
    setStatus('idle');
  }, []);

  const onRoomError = useCallback((error: Error) => {
    setStatus('error');
    setErrorMessage(error.message);
  }, []);

  return {
    status,
    serverUrl,
    token,
    errorMessage,
    connect,
    disconnect,
    onRoomConnected,
    onRoomDisconnected,
    onRoomError,
  };
}
