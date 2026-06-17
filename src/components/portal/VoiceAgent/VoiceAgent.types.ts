// VoiceAgent.types.ts - props + config types for the broker voice panel. Everything host specific
// (the token endpoint, labels, branding) is injected via props so the component can later move to a
// reusable package unchanged. The token-fetch response is validated with a Zod schema (defined in
// the hook); this module only declares the shapes the React layer renders against.

// Labels + branding the host supplies. No copy is hard-coded in the component itself.
export interface VoiceAgentConfig {
  // Panel title shown in the header.
  title: string;
  // One-line helper under the title before the broker connects.
  tagline: string;
  // Label for the connect / start-talking control.
  connectLabel: string;
  // Label for the disconnect / stop control.
  disconnectLabel: string;
}

export interface VoiceAgentProps {
  // POST endpoint that returns `{ serverUrl, token }` for the signed-in broker.
  tokenEndpoint: string;
  // Host-supplied labels + branding.
  appConfig: VoiceAgentConfig;
}

// Connection lifecycle for the panel, independent of the LiveKit room's internal state.
export type VoiceConnectionStatus =
  | 'idle'
  | 'requesting-token'
  | 'connecting'
  | 'connected'
  | 'error';

// What the hook exposes to the component. The room only mounts once `serverUrl` + `token` exist.
export interface UseVoiceAgentResult {
  status: VoiceConnectionStatus;
  serverUrl: string | undefined;
  token: string | undefined;
  errorMessage: string | undefined;
  connect: () => void;
  disconnect: () => void;
  onRoomConnected: () => void;
  onRoomDisconnected: () => void;
  onRoomError: (error: Error) => void;
}
