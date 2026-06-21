# ENTRY-014 — Public build lock landing

**Date:** 2026-06-20
**Type:** Feature / exposure control
**Version:** 1.4.3
**Branch:** `rescue/voice-logo-mixed-2026-06-17`

## Summary

The public site now hides the unfinished product experience behind a professional private-build landing page. The page keeps the offshore-broking signal, but it no longer exposes product-route links, auth CTAs, live voice controls, or the older experimental landing. A supervised particle preview now introduces two junior assistants in progress: one for chartering handoffs and one for vessel matching.

## What changed

- Replaced `/` with a locked private-build page: maritime intelligence canvas, chartering/matching assistant copy, status signals, and "The desk stays private while the service takes shape."
- Added `src/components/landing/BuildStatusPanel/` using the component-folder pattern, including selectable build-signal controls.
- Added `src/components/landing/JuniorVoiceAssistant/` using the component-folder pattern, including the `dispersed`, `forming`, and `formed` particle states plus short preview-only voice identity lines.
- Polished the assistant preview into one card with a subtler circular guide, projected 3D dot-sphere geometry, shorter status label, in-card disclosure content, stable section dividers, subtle active border, an explicit `.card-overlay` dimming layer that keeps the card color intact, and reserved right-side geometry so the voice, title, and extra-information sections do not move when "More info" opens.
- Shortened the public brand label to `ManuMu Offshore`.
- Removed browser speech synthesis from the public page; no LiveKit token endpoint is called from the public page.
- Redirected `/page2` to `/`.
- Updated unit and Playwright coverage for the new public posture.
- Refreshed landing desktop/mobile screenshots.
- Synced README, changelog, roadmap, project context, package metadata, and this journal entry.
- Updated ESLint ignores so copied Stage-0 evidence snapshots are not treated as active source files.

## Files touched

- `src/app/page.tsx`
- `src/app/page.module.css`
- `src/app/page.test.tsx`
- `src/app/BuildPageHero.tsx`
- `src/app/BuildPageHeroCanvas.tsx`
- `src/app/page2/page.tsx`
- `src/app/page2/page.test.tsx`
- `src/components/landing/BuildStatusPanel/*`
- `src/components/landing/JuniorVoiceAssistant/*`
- `e2e/landing.spec.ts`
- `e2e/smoke.spec.ts`
- `eslint.config.mjs`
- `public/assets/landing/landing-desktop-1440.png`
- `public/assets/landing/landing-mobile-390.png`
- `README.md`
- `CHANGELOG.md`
- `CONTEXT.md`
- `docs/architecture/PROJECT-CONTEXT.md`
- `docs/roadmap/ROADMAP.md`
- `package.json`
- `package-lock.json`

## Validation

- `npx vitest run src/app/page.test.tsx src/app/page2/page.test.tsx` — 5 tests passed.
- `npx playwright test e2e/landing.spec.ts` — 3 tests passed.
- `npx playwright test e2e/smoke.spec.ts` — 2 tests passed.
- `npm run typecheck` — passed.
- `npm run test` — 365 tests across 61 files passed.
- `npx eslint . --ext .ts,.tsx` — passed with six existing `prisma/seed.ts` unused-variable warnings.
- Landing browser preview — desktop and mobile screenshots verified that the junior assistant canvas renders, hover enters `forming`, and click locks `formed`.

## Notes

No migration, API contract, auth flow, or database change. The operational app remains behind auth; this patch changes the public presentation and blocks the legacy public experiment.

---

## Limited public assistant preview

**Date:** 2026-06-21
**Branch:** `feature/public-assistant-preview`
**Implements:** SPEC-003; preserves ADR-0004 (human-in-the-loop writes) and ADR-0005 (text-first shared brain, voice/RAG deferred).

### Summary

The locked landing's assistant card now performs a tiny, deterministic copilot-*behaviour* — without any of the broker copilot's data, tools, writes, voice, or model. Curated prompt buttons call a new public-safe route that returns approved public-context answers from a deterministic map. This copies the interaction shape of the private copilot, not its power.

### What changed

- Added a deterministic public-safe answer resolver (`src/lib/public-assistant/public-assistant-preview.ts`) with four curated prompt IDs and a scoped `400` for anything else. Answers are warm but preview-only, written in "trusted evidence layer" language; they contain no broker data.
- Added a public Zod-validated endpoint `POST /api/public/assistant-preview` (`src/app/api/public/assistant-preview/route.ts`). Tests prove it never imports broker copilot, broker auth, voice/LiveKit, or dashboard modules.
- Added `src/components/landing/PublicAssistantPreview/` (component, hook, types, styles, barrel): curated buttons, loading state, transcript-style answer, safe error fallback, and a Zod boundary on the response. No free-text input, no microphone, no voice controls.
- Integrated the preview into the assistant card after `BuildStatusPanel`; raised the reserved card height (820px desktop / 720px mobile) so the sphere, title row, and card do not move when "More info" opens or a prompt is asked.

### Why deterministic, and what it is NOT

The public preview is deterministic-first by decision: no LLM call, no RAG, no live voice. This avoids public model risk while still giving the card believable copilot behaviour. It is explicitly **not** live voice, **not** RAG, and **not** the full broker copilot (which stays private at `POST /api/broker/copilot`). LiveKit remains the correct future transport for real voice and is deliberately out of scope here.

### Files touched

- `src/lib/public-assistant/public-assistant-preview.ts` (+ `.test.ts`)
- `src/app/api/public/assistant-preview/route.ts` (+ `.test.ts`)
- `src/components/landing/PublicAssistantPreview/*` (5 files)
- `src/app/page.tsx`, `src/app/BuildPageHero.tsx`, `src/app/page.module.css`, `src/app/page.test.tsx`

### Validation

- `npx vitest run` (resolver + route + page) — 14 tests passed (2 + 5 + 7).
- `npm run typecheck` — passed (gate is `tsconfig.build.json`; raw `npx tsc --noEmit` is intentionally not a gate — see `INCIDENT-BUILD-raw-tsc-test-fixtures`).
- `npm run lint` — passed, no ESLint warnings or errors.
- `git diff --check` — clean for touched files.
- Browser (Chromium, desktop 1440 + mobile 390): prompt buttons return deterministic answers via `/api/public/assistant-preview`; the dim overlay activates on details-open and formed; measured title/sphere/card rects are unchanged across "More info", prompt click, and sphere activation — no layout shift. DOM exposes no `/api/broker/copilot` or `/api/broker/voice/token`.
