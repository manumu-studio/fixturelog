# SPEC-004: Junior Assistant — LLM Demo Pilot

| Field | Value |
|-------|-------|
| **Status** | Draft — demo-grade, ready to build on approval |
| **Date** | 2026-06-21 |
| **Author** | Manu Murillo |
| **Follows on from** | [SPEC-003](SPEC-003-limited-public-assistant-copilot.md) line 87 — "replace the answer map with a constrained model call" |
| **Relates to** | [ADR-0005](../decisions/ADR-0005-text-first-shared-broker-brain.md) — RAG deferred (not used here; data is tiny) |

## Purpose

Upgrade the *already-shipped* deterministic public assistant (`POST /api/public/assistant-preview`)
from a fixed answer-map to a **constrained LLM** that answers a visitor's free-text question,
grounded only on a small curated public context. This is an intentionally **short-lived,
demo-grade** surface (open a few days), not a hardened production endpoint.

## Binding decisions

- **No RAG.** The answerable data is tiny — the whole curated context fits in the system prompt.
  Retrieval/embeddings would be over-engineering (consistent with ADR-0005's "defer RAG").
- **Model:** Claude Haiku (cheap, fast) via the AI SDK. Cost is acceptable for a few-days window.
- **Grounding:** one curated file, `docs/public-assistant/knowledge.md` (approved public facts only).
  Stuffed verbatim into the system prompt. No broker data, dashboard data, tools, writes, or voice.
- **Output scoping (portfolio safety):** the system prompt hard-bounds the assistant to the public
  context and instructs it to refuse/redirect anything outside it. Low `max_tokens`. This is the
  guard against a visitor jailbreaking it into off-brand output — the real risk for a public LLM,
  now that cost is not a concern.
- **Public-safe boundary (inherited from SPEC-003):** must never import broker copilot, broker auth,
  voice/LiveKit, or dashboard modules; no microphone; no `/api/broker/*`.

## Rate guard (abuse + cost ceiling)

- **3 questions per visitor**, then **block that visitor for 12 hours** (constants, easily tuned).
- **Keyed on both** a first-party session cookie (`ja_demo_id`) and the request IP:
  - cookie = the normal per-browser case;
  - IP = coarse backstop so clearing cookies doesn't grant unlimited tries.
  - A visitor is blocked if **either** key is over its limit.
- Over-limit returns **HTTP 429** with a friendly message and a `retryAfter` (seconds). The UI shows
  a calm "you've reached the preview limit — check back later" state, not an error.
- Storage: a small server-side counter with a 12h TTL (in-memory Map for the demo is acceptable
  given the short window and single instance; note the limitation in code).

## API shape

`POST /api/public/assistant-preview` (extended):

```json
// request
{ "question": "What is FixtureLog building?" }
// response (200)
{ "answer": "FixtureLog is preparing a private broker and charterer service…", "mode": "preview", "remaining": 2 }
// response (429)
{ "error": "preview_limit_reached", "retryAfter": 43200 }
```

- Zod-validate input: `question` is a bounded non-empty string (e.g. ≤ 300 chars). Reject oversize
  with 400 before any model call.
- Keep the existing curated prompt buttons in the UI as quick-start suggestions; the field also
  accepts free text. (The deterministic answer-map can remain as the 429/error fallback.)

## Tests

- 4th question from the same visitor returns 429 (rate guard fires on the cookie key and on the IP key).
- Oversize / empty question returns 400 before the model is called.
- An off-context / injection-style question is refused or redirected, not answered (scoping holds).
- Import-safety: the route never imports broker copilot, broker auth, voice, or dashboard modules.
- Landing still exposes no `/api/broker/*`, sign-in CTAs, mic, or live voice controls.

## Out of scope

- RAG / embeddings / vector store. Broker data, tools, writes, approval flow. Voice / LiveKit /
  microphone. Persisting transcripts. Long-term/production rate-limit infra (Redis, etc.).

## Rollback

- Demo-only: flip a `JUNIOR_LLM_DEMO` flag off (or let the window lapse) → the route falls back to
  the existing deterministic answer-map. No data, no migration; removal is a single revert.
