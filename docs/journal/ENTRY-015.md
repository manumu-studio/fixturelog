# ENTRY-015 — Junior Assistant LLM Demo Pilot (v1.6.0)

**Date:** 2026-06-21
**Type:** Feature (public surface, flag-gated)
**Branch:** `feat/junior-llm-demo`
**Spec:** [SPEC-004](../specs/SPEC-004-junior-llm-demo-pilot.md)

## Summary

Upgraded the already-shipped deterministic public assistant card so a visitor can ask a free-text
question and get a grounded LLM answer — built as a short-lived, demo-grade portfolio surface, not a
hardened production endpoint. Off by default; flip `JUNIOR_LLM_DEMO=true` + set a real
`ANTHROPIC_API_KEY` to activate.

## Files touched

- `src/lib/public-assistant/public-assistant-knowledge.ts` + `docs/public-assistant/knowledge.md` — curated public context (runtime mirror + doc).
- `src/lib/public-assistant/junior-assistant-llm.ts` — single-shot, tool-free Claude Haiku call; output-scoped prompt; degrades to `ok:false`.
- `src/lib/public-assistant/junior-rate-guard.ts` — 3/visitor + 12/IP per 12h, in-memory.
- `src/app/api/public/assistant-preview/route.ts` — added the `{ question }` path (flag-gated, rate-guarded, graceful fallback); kept `{ promptId }` deterministic.
- `src/components/landing/PublicAssistantPreview/*` — free-text input + remaining / limit-reached states.
- `src/lib/env.server.schema.ts` — `JUNIOR_LLM_DEMO` flag (default off).
- Tests: `junior-rate-guard.test.ts`, `junior-assistant-llm.test.ts`, `route.llm.test.ts` (14 new).

## Key decisions

- **No RAG** — the answerable public data is tiny; the whole curated context fits in the system prompt. Retrieval would be over-engineering (consistent with ADR-0005's "defer RAG").
- **Knowledge embedded as a TS const** (mirrored to a doc) rather than read from disk at runtime — reliable in the serverless bundle.
- **Cookie + IP rate keys** — cookie for the normal per-visitor case, a higher IP backstop so cookie-clearing can't grant unlimited tries without hard-blocking colleagues behind one NAT.
- **Graceful degrade over hard failure** — flag-off, model error, or empty answer all return the deterministic preview message; the public route never 500s.
- **Off by default** — the LLM only runs when explicitly enabled for the demo window.

## Verification

`npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` ✅ 398/398. Live-checked via dev server:
deterministic prompt, cookie issuance, `remaining` countdown, and the 4th-question `429` all confirmed
(answers fell back to the deterministic message under a placeholder key — graceful degrade working).
