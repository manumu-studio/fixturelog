# PR-1.6.0 — Junior Assistant LLM Demo Pilot

**Branch:** `feat/junior-llm-demo` → `main`
**Spec:** SPEC-004 · **Journal:** ENTRY-015

## Summary

The public assistant card's free-text box, when enabled, returns a grounded Claude answer scoped to a
curated public knowledge file. Demo-grade and **off by default**: a short-lived portfolio surface for
people evaluating the project, not a hardened production endpoint.

## What was built

- **LLM answer** (`junior-assistant-llm.ts`) — single-shot, tool-free Claude Haiku over an
  output-scoped system prompt; refuses off-context; degrades to a safe fallback on any failure.
- **Rate guard** (`junior-rate-guard.ts`) — 3 questions/visitor + 12/IP per 12h, calm `429`.
- **Route** — `POST /api/public/assistant-preview` now takes `{ question }` (Zod ≤300 chars) behind
  `JUNIOR_LLM_DEMO`; `{ promptId }` stays deterministic; never 500s.
- **UI** — free-text input + "questions left" / "limit reached" states in `PublicAssistantPreview`.
- **Knowledge** — `docs/public-assistant/knowledge.md` + runtime mirror.

## Why it's safe

Output-scoped prompt (no off-context answers, no instruction leaks), low max-tokens, deterministic
fallback, rate limit. No broker data/tools/writes, no microphone, no LiveKit, no `/api/broker/*`.
No RAG (curated data is tiny).

## Testing

`typecheck` ✅ · `lint` ✅ · `test` ✅ **398/398** (14 new). Live dev-server check confirmed the
deterministic path, cookie issuance, `remaining` countdown, and the 4th-question `429`.

## Deployment / how to activate

1. Merge → Vercel auto-deploys.
2. In Vercel → Settings → Environment Variables, set `JUNIOR_LLM_DEMO=true` and a real
   `ANTHROPIC_API_KEY` (`sk-ant-…`). Redeploy.
3. Open the landing → assistant card → type a question → grounded answer.
4. **Rollback:** delete `JUNIOR_LLM_DEMO` (or set `false`) → reverts to the deterministic preview, no
   redeploy of code needed.

Without the real key the card still works — it just serves the deterministic fallback for free-text.
