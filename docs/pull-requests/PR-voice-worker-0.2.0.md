# PR — Voice worker: natural TTS (Cartesia → ElevenLabs) · voice-worker 0.2.0

## Summary

Makes the broker voice copilot sound natural instead of robotic by swapping the pipeline
brain's TTS from Cartesia (running on its generic default voice) to **ElevenLabs**. The brain
is unchanged — still Deepgram STT → **Claude (`claude-haiku-4-5`)** → TTS. Voice-only change.

## What changed

- **`voice-worker/brain.py`** — pipeline TTS is now
  `elevenlabs.TTS(voice_id=ELEVENLABS_VOICE_ID, model=ELEVENLABS_MODEL)`.
  - `ELEVENLABS_VOICE_ID` (env, default premade **"Daniel"** `onwK4e9ZLuTAKqWW03F9`)
  - `ELEVENLABS_MODEL` (env, default **`eleven_turbo_v2_5`** — natural + low latency)
- **`voice-worker/pyproject.toml`** — `livekit-agents[…]` extra `cartesia` → `elevenlabs`; version `0.2.0`.
- **`voice-worker/uv.lock`** — re-locked: `livekit-plugins-cartesia` removed, `livekit-plugins-elevenlabs` 1.6.0 added.
- **`voice-worker/.env.example`**, **`voice-worker/README.md`** — docs synced (key + brain description).

## Architecture decisions

- **TTS-layer fix, not a brain change.** Naturalness in a cascade pipeline is a TTS concern, so
  the change is isolated to the voice. Claude grounding/persona, Deepgram STT, Silero VAD, and
  the multilingual turn detector are untouched.
- **Did not switch to the `realtime` brain.** That would replace Claude with OpenAI `gpt-realtime`
  and require re-validating grounding — out of scope for a "make it sound human" fix.
- **Env-overridable voice/model.** Retune on Railway with no code change.
- **Least-privilege key.** Text-to-Speech-only ElevenLabs key; premade voices are used directly,
  so no `voices_read` is needed.

## Testing / verification

- Live ElevenLabs TTS call with the real key → **HTTP 200** + valid audio (Daniel/Brian/Rachel/Adam).
- `python -c "import brain"` → clean import; voice/model constants resolve.
- **`uv sync --locked --no-dev`** (the exact Dockerfile dependency step) → **exit 0** (build won't break on lock mismatch).
- `grep` confirms no `cartesia` / `sonic-3` / `CARTESIA` references remain.

## Deployment notes (Railway builds `voice-worker` from `main`)

1. Merge this PR to `main`.
2. On the worker service: set **`ELEVENLABS_API_KEY`** (delete the now-unused `CARTESIA_API_KEY`); keep `VOICE_BRAIN=pipeline`.
3. Redeploy. Optional: set `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` to retune the voice.

## How to verify after deploy

Open the LiveKit playground for the project, join the broker room, and speak — the reply should
be in the ElevenLabs voice (Daniel by default), not the previous robotic voice.
