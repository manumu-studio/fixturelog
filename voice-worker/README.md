# FixtureLog voice worker

Python `livekit-agents` worker for the Broker Copilot voice interface. The worker
is a long-lived process, so it deploys to **Railway**; the Next.js app, token
route, and tool gateway stay on **Vercel**. Same repo, two deployables.

## Transport proof (echo agent)

The current `agent.py` is a throwaway **audio echo**: it joins a LiveKit Cloud
room and loops your microphone back to you. It proves the WebRTC path end to end
with **LiveKit Cloud credentials only** — no Deepgram / Cartesia / Anthropic keys
yet. The Deepgram -> Claude -> Cartesia pipeline brain arrives next.

### Run it
1. `cd voice-worker`
2. `uv sync` — provisions Python 3.12 (the ML plugins have no 3.14 wheels) and installs from `uv.lock`.
3. `cp .env.example .env` and fill `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
4. `uv run python agent.py dev`
5. Open the LiveKit **agents playground** / sandbox for the same project, join the room, and speak. You should hear your own audio echoed back — that confirms two-way transport.

## Notes
- Startup form: `AgentServer()` + `@server.rtc_session` + `agents.cli.run_app(server)` (verified against the live docs on 2026-06-16). Re-confirm against the exact `livekit-agents` 1.x that `uv.lock` resolves.
- All provider keys live only on the worker. `.env` is gitignored; only `.env.example` is committed.
