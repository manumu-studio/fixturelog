// VoiceAgent.tsx - broker voice panel. A connect/disconnect control mints a token (via the hook) and
// mounts a LiveKitRoom; inside the room, useVoiceAssistant drives a live transcript, a BarVisualizer
// of the agent's audio, and a connection-health line derived from the agent state. Fully prop-driven:
// `tokenEndpoint` and `appConfig` (labels/branding) carry every host specific, so the component can
// move to a reusable package unchanged. Token-only styling (--fl-*). All auth + grounding is server
// side; this is UI only. No keys ever reach the client - the token comes from the session-bound route.
'use client';

import {
  BarVisualizer,
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceAgent } from './useVoiceAgent';
import type { VoiceAgentProps } from './VoiceAgent.types';
import styles from './VoiceAgent.module.css';

// Human-readable health line from the agent's lifecycle state, shown while connected.
const AGENT_STATE_LABEL: Record<string, string> = {
  initializing: 'Warming up…',
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  connecting: 'Connecting…',
  disconnected: 'Disconnected',
  failed: 'Connection failed',
};

// Live assistant view - only valid inside LiveKitRoom (useVoiceAssistant reads room context).
function AssistantView() {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const health = AGENT_STATE_LABEL[state] ?? state;

  return (
    <div className={styles.live}>
      <div className={styles.healthRow}>
        <span className={styles.healthDot} data-state={state} aria-hidden="true" />
        <span className={styles.healthText}>{health}</span>
      </div>

      {/* trackRef is only passed when defined: exactOptionalPropertyTypes forbids `undefined`. */}
      {audioTrack !== undefined ? (
        <BarVisualizer
          state={state}
          trackRef={audioTrack}
          barCount={5}
          className={styles.visualizer}
        />
      ) : (
        <BarVisualizer state={state} barCount={5} className={styles.visualizer} />
      )}

      <ul className={styles.transcript} aria-label="Live transcript">
        {agentTranscriptions.length === 0 ? (
          <li className={styles.transcriptEmpty}>The copilot has not spoken yet.</li>
        ) : (
          agentTranscriptions.map((segment) => (
            <li key={segment.id} className={styles.transcriptLine}>
              {segment.text}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function VoiceAgent({ tokenEndpoint, appConfig }: VoiceAgentProps) {
  const {
    status,
    serverUrl,
    token,
    errorMessage,
    connect,
    disconnect,
    onRoomConnected,
    onRoomDisconnected,
    onRoomError,
  } = useVoiceAgent(tokenEndpoint);

  const isLive = status === 'connecting' || status === 'connected';
  const isBusy = status === 'requesting-token' || status === 'connecting';

  return (
    <section className={styles.root} aria-label={appConfig.title}>
      <header className={styles.header}>
        <span className={styles.title}>{appConfig.title}</span>
        <span className={styles.tagline}>{appConfig.tagline}</span>
      </header>

      <div className={styles.body}>
        {isLive && serverUrl !== undefined && token !== undefined ? (
          <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={true}
            audio={true}
            onConnected={onRoomConnected}
            onDisconnected={onRoomDisconnected}
            onError={onRoomError}
          >
            <RoomAudioRenderer />
            <AssistantView />
          </LiveKitRoom>
        ) : (
          <p className={styles.idle}>{appConfig.tagline}</p>
        )}

        {errorMessage !== undefined && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}

        <div className={styles.controls}>
          {isLive ? (
            <button type="button" className={styles.stop} onClick={disconnect}>
              {appConfig.disconnectLabel}
            </button>
          ) : (
            <button
              type="button"
              className={styles.start}
              onClick={connect}
              disabled={isBusy}
            >
              {isBusy ? '…' : appConfig.connectLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
