# ENTRY-016 — Voice worker TTS swap: Cartesia → ElevenLabs

**Date:** 2026-06-21
**Type:** change / quality improvement (voice-worker)
**Branch:** fix/voice-elevenlabs-tts
**Version:** voice-worker 0.1.0 → 0.2.0

## Summary

The broker voice copilot's pipeline brain sounded robotic. Root cause was not a model or
wiring problem: the pipeline ran `cartesia.TTS(model="sonic-3")` with **no `voice=`**, so it
spoke in Cartesia's generic default voice. In the Deepgram STT → Claude → TTS cascade, the
naturalness of the spoken output comes almost entirely from the TTS layer, so the fix lives
there. Swapped the TTS provider to **ElevenLabs**, keeping the brain (Claude `claude-haiku-4-5`),
STT (Deepgram `nova-3`), VAD (Silero), and turn detection unchanged.

## Files touched

- `voice-worker/brain.py` — `cartesia.TTS(...)` → `elevenlabs.TTS(voice_id=…, model=…)`;
  import swap; added env-overridable `ELEVENLABS_VOICE_ID` (default premade "Daniel",
  `onwK4e9ZLuTAKqWW03F9`) and `ELEVENLABS_MODEL` (default `eleven_turbo_v2_5`).
- `voice-worker/pyproject.toml` — `livekit-agents` extra `cartesia` → `elevenlabs`; version 0.2.0.
- `voice-worker/uv.lock` — re-locked: `livekit-plugins-cartesia` out, `livekit-plugins-elevenlabs` 1.6.0 in.
- `voice-worker/.env.example` — `CARTESIA_API_KEY` → `ELEVENLABS_API_KEY` (+ optional voice/model knobs).
- `voice-worker/README.md` — pipeline description updated.

## Rationale

- The complaint was naturalness, and naturalness in a cascade pipeline is a TTS concern.
  ElevenLabs (`eleven_turbo_v2_5`) is natural and low-latency, which is what real-time spoken
  turns need.
- Keeping Claude as the brain preserves all existing grounding/persona — the swap is voice-only.
  (The alternative, the OpenAI `realtime` brain, would have replaced Claude and required
  re-validating grounding; explicitly avoided.)

## Key decisions

- **Voice/model via env vars, not hardcoded.** The voice can be retuned on Railway with
  `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` without a code change or new image logic.
- **Default voice picked to fit the persona** ("calm, brief, evidence-led"): premade "Daniel".
- **Least-privilege key.** The ElevenLabs key is Text-to-Speech-only (no `voices_read`); premade
  voices are usable directly, so the worker never calls the list-voices endpoint.

## Verification

- ElevenLabs TTS smoke test with the real key → HTTP 200 + audio for Daniel/Brian/Rachel/Adam.
- `brain.py` imports cleanly; `uv sync --locked --no-dev` (the exact Dockerfile build step) → exit 0.
- No Cartesia references remain in source.

## Deployment notes

Railway builds the worker from `main`. After merge: ensure `ELEVENLABS_API_KEY` is set on the
worker service (remove the now-unused `CARTESIA_API_KEY`), keep `VOICE_BRAIN=pipeline`, redeploy.
