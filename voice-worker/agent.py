"""FixtureLog voice worker — TASK-101 transport proof (throwaway echo agent).

Joins a LiveKit Cloud room and loops the broker's microphone audio straight
back to them. It proves the WebRTC transport end to end using LiveKit Cloud
credentials ONLY (no Deepgram / Cartesia / Anthropic keys). TASK-102 replaces
this echo with the real Deepgram -> Claude -> Cartesia pipeline brain.

Startup form verified against the live livekit-agents docs on 2026-06-16:
    server = AgentServer(); @server.rtc_session(...); agents.cli.run_app(server)
Re-confirm against the exact 1.x that `uv lock` resolves.
"""

from __future__ import annotations

import asyncio
import logging

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, AutoSubscribe, JobContext

load_dotenv(".env")

logger = logging.getLogger("fixturelog-voice")

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


@server.rtc_session(agent_name="fixturelog-voice")
async def entrypoint(ctx: JobContext) -> None:
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
    logger.info(
        "connected to room %s as %s", room.name, room.local_participant.identity
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
