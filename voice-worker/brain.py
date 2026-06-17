"""Swappable brain adapter for the FixtureLog voice worker.

The "brain" is a config choice so the same worker can run either a Claude cascade
(default) or a speech-to-speech realtime model, selected by env. Both branches return a
ready AgentSession with identical wiring seams (broker id in userdata, the multilingual
turn detector), so tools can be injected the same way regardless of brain later.

    "pipeline"  (default)  Deepgram STT -> Claude -> Cartesia TTS, Silero VAD, multilingual
                           turn detection. Needs the LiveKit trio PLUS Deepgram / Cartesia
                           / Anthropic keys.
    "realtime"             OpenAI speech-to-speech realtime model, with Deepgram STT passed
                           in so the turn model still gets text, and multilingual turn
                           detection. Needs OPENAI_API_KEY (only when this brain is selected).

Provider plugins are imported at module top because LiveKit requires plugins to register on
the MAIN THREAD at import time. Importing them needs no API keys (a key is only read when a
model is actually constructed or called, which stays inside the build functions). The
realtime guard still holds: RealtimeModel is only constructed when "realtime" is selected,
so the default pipeline never touches OPENAI_API_KEY. Unknown brain strings fall back to
pipeline.

Brain APIs verified against livekit-agents / livekit-plugins-openai 1.6 on 2026-06-16.
"""

from __future__ import annotations

from livekit.agents import AgentSession, TurnHandlingOptions
from livekit.plugins import anthropic, cartesia, deepgram, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Anthropic model id - matches FixtureLog's existing text copilot.
LLM_MODEL = "claude-haiku-4-5"

# OpenAI speech-to-speech realtime model id (livekit-plugins-openai 1.6 default).
REALTIME_MODEL = "gpt-realtime"


def _build_pipeline(broker_id: str | None) -> AgentSession:
    """Claude cascade: Deepgram STT -> Claude -> Cartesia TTS, Silero VAD, turn detection."""
    return AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=anthropic.LLM(model=LLM_MODEL),
        tts=cartesia.TTS(model="sonic-3"),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(turn_detection=MultilingualModel()),
        userdata={"broker_id": broker_id},
    )


def _build_realtime(broker_id: str | None) -> AgentSession:
    """OpenAI realtime brain. STT is still passed so the turn model has text to work with.

    Only constructed when "realtime" is selected, so the OPENAI_API_KEY check at model
    construction never fires for the default pipeline brain."""
    return AgentSession(
        llm=openai.realtime.RealtimeModel(model=REALTIME_MODEL),
        stt=deepgram.STT(model="nova-3"),
        turn_handling=TurnHandlingOptions(turn_detection=MultilingualModel()),
        userdata={"broker_id": broker_id},
    )


def build_session(brain: str, broker_id: str | None) -> AgentSession:
    """Build the configured brain. Defaults to the Claude pipeline; falls back to it for any
    unknown brain string so a typo or a future value can never leave the worker brainless."""
    if brain == "realtime":
        return _build_realtime(broker_id)
    # "pipeline" and any unknown value fall back to the Claude cascade (the safe default).
    return _build_pipeline(broker_id)
