"""FixtureLog voice worker - broker copilot entrypoint (echo, pipeline, or realtime brain).

Joins a LiveKit Cloud room as the broker's voice copilot. The brain is chosen by the
VOICE_BRAIN env var:

    VOICE_BRAIN=echo                 Raw audio loopback (no AI providers). Proves the WebRTC
                                     transport on LiveKit credentials alone. Handled here.
    VOICE_BRAIN=pipeline  (default)  Deepgram STT -> Claude -> Cartesia TTS, with Silero
                                     VAD and the multilingual turn detector. Needs the
                                     LiveKit trio PLUS Deepgram / Cartesia / Anthropic keys.
    VOICE_BRAIN=realtime             OpenAI speech-to-speech realtime model (Deepgram STT for
                                     the turn model). Needs OPENAI_API_KEY when selected.

The pipeline and realtime brains are built by build_session in brain.py; echo lives here.
The broker id is a signed claim end to end: the token route mints it into the participant's
attributes, and the AgentSession brains read it back off the joined participant and stow it
in session userdata for the tools that land later. No FixtureLog tools yet - this is an
instructions-only agent.

Startup form + brain API verified against livekit-agents 1.6 on 2026-06-16.
"""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AutoSubscribe,
    JobContext,
)

from brain import build_session

load_dotenv(".env")

logger = logging.getLogger("fixturelog-voice")

# Brain selector: "echo" (transport-only loopback), "pipeline" (Claude cascade, default),
# or "realtime" (OpenAI speech-to-speech). echo is handled here; the other two delegate
# to build_session, which falls back to pipeline for any unknown value.
VOICE_BRAIN = os.getenv("VOICE_BRAIN", "pipeline").strip().lower()

# Dispatch mode. Empty (default) registers the agent WITHOUT a name -> automatic dispatch:
# it joins any room created in the project, which is what the LiveKit playground needs for a
# quick test. Set AGENT_NAME=fixturelog-voice for explicit dispatch in production, where only
# token-routed broker rooms should get the agent.
AGENT_NAME = os.getenv("AGENT_NAME", "").strip()

# Broker copilot persona. Instructions only; tools (read/write + confirm gate) land later.
COPILOT_INSTRUCTIONS = (
    "You are FixtureLog's voice copilot for an offshore shipbroker. "
    "Answer only from the desk's real data and any tool results; never invent vessels, "
    "deals, rates, or numbers, and say so plainly when you do not have something. "
    "Keep replies short and spoken-friendly. You are grounded, broker-only, and "
    "human-in-the-loop: you never take a state-changing action on your own."
)

server = AgentServer()


async def _echo_audio_track(room: rtc.Room, track: rtc.RemoteAudioTrack) -> None:
    """Loop one remote audio track back into the room as the agent's own track."""
    audio_stream = rtc.AudioStream(track)
    source: rtc.AudioSource | None = None
    try:
        async for event in audio_stream:
            frame = event.frame
            if source is None:
                # Build the echo source from the first frame's real format.
                source = rtc.AudioSource(frame.sample_rate, frame.num_channels)
                local_track = rtc.LocalAudioTrack.create_audio_track("echo", source)
                await room.local_participant.publish_track(
                    local_track,
                    rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE),
                )
                logger.info(
                    "echo source ready: %d Hz, %d ch",
                    frame.sample_rate,
                    frame.num_channels,
                )
            await source.capture_frame(frame)
    finally:
        await audio_stream.aclose()


async def _run_echo(ctx: JobContext) -> None:
    """Transport-only brain: loop the broker's mic straight back (no AI providers)."""
    room = ctx.room

    @room.on("track_subscribed")
    def _on_track_subscribed(
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        if track.kind == rtc.TrackKind.KIND_AUDIO and isinstance(
            track, rtc.RemoteAudioTrack
        ):
            logger.info("echoing audio from %s", participant.identity)
            asyncio.create_task(_echo_audio_track(room, track))

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("echo brain connected to room %s", room.name)


async def _run_pipeline(ctx: JobContext) -> None:
    """AgentSession brain (pipeline default, realtime alt), grounded as the broker copilot.

    The brain is chosen by VOICE_BRAIN and built by build_session; this function owns the
    transport, the broker-id read, and the session lifecycle, identical for either brain."""
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    session = build_session(VOICE_BRAIN, None)

    # Best-effort: capture the signed broker id (minted by the token route into the
    # participant attributes) for the tools that land later. Do NOT block the greeting on
    # it - console mode and early greetings have no remote participant to wait for.
    def _capture_broker_id(participant: rtc.RemoteParticipant) -> None:
        broker_id = participant.attributes.get("broker_id")
        if broker_id:
            logger.info("captured broker_id=%s", broker_id)

    ctx.room.on("participant_connected", _capture_broker_id)

    await session.start(Agent(instructions=COPILOT_INSTRUCTIONS), room=ctx.room)
    await session.generate_reply(instructions="Greet the broker briefly.")


_dispatch_opts = {"agent_name": AGENT_NAME} if AGENT_NAME else {}


@server.rtc_session(**_dispatch_opts)
async def entrypoint(ctx: JobContext) -> None:
    if VOICE_BRAIN == "echo":
        await _run_echo(ctx)
    else:
        await _run_pipeline(ctx)


if __name__ == "__main__":
    agents.cli.run_app(server)
