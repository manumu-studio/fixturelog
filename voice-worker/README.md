# FixtureLog voice worker

Python `livekit-agents` worker for the Broker Copilot voice interface. The worker
is a long-lived process, so it deploys to **Railway**; the Next.js app, token
route, and tool gateway stay on **Vercel**. Same repo, two deployables.

## Brains (`VOICE_BRAIN`)

The worker's brain is a config choice, set by the `VOICE_BRAIN` env var:

- `echo` - throwaway **audio loopback**: joins a LiveKit Cloud room and loops your
  microphone back to you. Proves the WebRTC path with **LiveKit Cloud credentials only**,
  no AI providers. Handled in `agent.py`.
- `pipeline` (default) - Deepgram STT -> Claude -> ElevenLabs TTS cascade, with Silero VAD
  and the multilingual turn detector. Needs the LiveKit trio plus Deepgram, ElevenLabs, and
  Anthropic keys. Built by `build_session` in `brain.py`. The voice is env-overridable
  (`ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`); the default is the premade "Daniel" voice.
- `realtime` - OpenAI speech-to-speech realtime model, with Deepgram STT passed in so the
  turn model still gets text. Needs `OPENAI_API_KEY`, only when this brain is selected.

`brain.py` imports each provider plugin lazily, so a bare `import brain` loads no provider
packages and the realtime path's OpenAI key check fires only when `realtime` is chosen. An
unknown `VOICE_BRAIN` value falls back to `pipeline`.

### Run it
1. `cd voice-worker`
2. `uv sync` - provisions Python 3.12 (the ML plugins have no 3.14 wheels) and installs from `uv.lock`.
3. `cp .env.example .env` and fill the keys your chosen brain needs (`echo` needs only the LiveKit trio).
4. `uv run python agent.py dev`
5. Open the LiveKit **agents playground** / sandbox for the same project, join the room, and speak. With `echo` you hear your own audio back (two-way transport); with `pipeline` / `realtime` you hold a spoken conversation with the copilot.

## Notes
- Startup form: `AgentServer()` + `@server.rtc_session` + `agents.cli.run_app(server)` (verified against the live docs on 2026-06-16). Re-confirm against the exact `livekit-agents` 1.x that `uv.lock` resolves.
- All provider keys live only on the worker. `.env` is gitignored; only `.env.example` is committed.
