# FixtureLog voice worker production image (deploys to Railway).
#
# Long-lived livekit-agents 1.6 worker. Builds in two stages on the official uv image,
# installs the locked deps, BAKES the turn-detector / silero model files at build time so
# cold starts never re-download them, then runs the production "start" command as a
# non-root user. The worker only opens an OUTBOUND WebSocket to LiveKit Cloud (the hosted
# SFU does the WebRTC media), so Railway's lack of UDP does not affect it and no inbound
# media port is needed. The agents runtime serves a TCP health endpoint on 8081.
#
# Pattern adapted from the official LiveKit agent-starter-python Dockerfile, pinned to
# Python 3.12 because the ML plugins (silero / turn-detector / onnxruntime) publish no
# 3.13/3.14 wheels and pyproject requires ">=3.11,<3.13".

# syntax=docker/dockerfile:1

# Official uv base image. 3.12 satisfies requires-python ">=3.11,<3.13" and has plugin wheels.
ARG PYTHON_VERSION=3.12
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

# Unbuffered logs so a crash never swallows output; compile to .pyc at install for faster
# first import (lower cold start). Bake model caches under /app so they survive the stage copy.
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV HF_HOME=/app/.cache/huggingface
ENV TORCH_HOME=/app/.cache/torch

# --- Build stage: install deps, bake models ---
FROM base AS build

# Compilers + headers for any package that builds a native extension. Dropped from the
# final image because the production stage starts clean from "base".
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the dependency manifests first so this layer caches across code-only changes.
COPY pyproject.toml uv.lock ./

# Install the locked dependency graph (no dev group, exact versions from uv.lock).
# [tool.uv] package = false means only deps are installed, no project package, which is
# what this app-not-a-library worker wants.
RUN uv sync --locked --no-dev

# Bake the turn-detector / silero model files into the image BEFORE copying app code, so
# this layer is cached across code-only changes and cold starts never download at runtime.
# The module form discovers installed livekit-plugins-* without importing agent.py.
RUN uv run --module livekit.agents download-files

# Copy the worker source (agent.py + brain.py + README). .dockerignore keeps secrets and
# local cruft (.env, .venv, __pycache__) out.
COPY . .

# --- Production stage: clean base, no compilers ---
FROM base

# Non-root user for the running process (security best practice).
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Runtime shared library OpenMP (libgomp1) is needed by onnxruntime, which silero VAD and
# the turn detector load. The slim base does not ship it; without it the worker crashes on
# the first model load.
RUN apt-get update && apt-get install -y \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# Bring over the installed venv, the baked model caches, and the app code in one owned copy.
COPY --from=build --chown=appuser:appuser /app /app

WORKDIR /app

USER appuser

# The agents runtime exposes a TCP health endpoint on 8081 (used by load balancers /
# platform health checks). Documented here even though Railway can run the worker without it.
EXPOSE 8081

# Production start. "start" enables graceful shutdown + optimized logging and connects the
# worker to LiveKit Cloud to wait for jobs. uv activates the venv. agent.py imports brain.py
# from the same dir, so it must run with /app as the working directory (set above).
CMD ["uv", "run", "python", "agent.py", "start"]
