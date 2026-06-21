# PR — v1.4.3 — Public build lock landing

**Branch:** `rescue/voice-logo-mixed-2026-06-17` → `main`
**Type:** Feature / exposure control

## What this PR does

Replaces the public product landing with a professional private-build page:

- hides unfinished product links and auth CTAs from `/`;
- adds a polished two-assistant message for offshore broking visitors: chartering handoffs plus vessel matching;
- adds `BuildStatusPanel`, a build-status disclosure that explains the service is still being prepared;
- adds one integrated assistant preview card containing `JuniorVoiceAssistant`, a supervised 3D dot-sphere particle preview with `dispersed`, `forming`, and `formed` states, short preview-only voice identity lines, plus in-card build-status disclosure content, stable section dividers, an explicit `.card-overlay` dimming layer, and reserved right-side geometry so "More info" does not move the card sections; it has no microphone access, LiveKit, or backend voice calls;
- shortens the public brand label to `ManuMu Offshore`;
- redirects `/page2` to `/` so the old experimental landing is not public;
- refreshes desktop/mobile landing screenshots;
- updates tests, package metadata, and living docs to v1.4.3.

## Why it was needed

The current authenticated product has several surfaces that are still useful for development, but the public site should not invite company visitors into a half-polished demo. This PR keeps the public impression controlled: professional, intriguing, and honest that the broker/charterer service, chartering assistant, and matching assistant are still being prepared.

## Verification

```bash
npx vitest run src/app/page.test.tsx src/app/page2/page.test.tsx
npx playwright test e2e/landing.spec.ts
npx playwright test e2e/smoke.spec.ts
npm run typecheck
npm run test
npx eslint . --ext .ts,.tsx
```

Results:

- Focused landing tests: 5 passed.
- Landing E2E: 3 passed.
- Smoke E2E: 2 passed.
- Full unit suite: 365 tests across 61 files passed.
- Typecheck passed.
- ESLint passed with six existing `prisma/seed.ts` unused-variable warnings.
- Landing browser preview passed on desktop and mobile: the junior assistant canvas rendered, hover entered `forming`, and click locked `formed`.

## Deployment notes

No migration, API change, auth provider change, or environment variable change. Deploying this commit changes public `/` immediately; authenticated operational routes remain protected as before.

---

## Limited public assistant preview

**Implements:** SPEC-003 · **Preserves:** ADR-0004, ADR-0005 · **Branch:** `feature/public-assistant-preview`

### What this adds

Gives the public assistant card a tiny, deterministic copilot *behaviour* while keeping the full broker copilot private:

- a new deterministic resolver (`src/lib/public-assistant/public-assistant-preview.ts`) with four curated prompt IDs and a scoped `400` for unknown IDs;
- a public, Zod-validated endpoint `POST /api/public/assistant-preview` (`src/app/api/public/assistant-preview/route.ts`) with route + import-safety tests;
- a compact `PublicAssistantPreview` card UI (`src/components/landing/PublicAssistantPreview/`): curated buttons, loading state, transcript-style answer, safe error fallback, Zod response boundary, no free-text input;
- integration into the existing assistant card after `BuildStatusPanel`, with reserved card height so the sphere, title row, and card do not shift when "More info" opens or a prompt is asked.

### What it deliberately is NOT

Deterministic and public-safe by design: **no LLM call, no RAG, no live voice, no microphone, no LiveKit, no broker data/tools/writes, and no call or import of `POST /api/broker/copilot`.** It is **not** live voice, **not** RAG, and **not** the full broker copilot. LiveKit remains the future transport for real voice and is out of scope.

### Why it was needed

The private broker copilot is the project's most credible AI signal, but it must stay private. This release lets the public landing demonstrate the *interaction* — calm, supervised, evidence-led prompts and answers — without exposing any of the copilot's power or the desk's data.

### Verification

```bash
npx vitest run \
  src/lib/public-assistant/public-assistant-preview.test.ts \
  src/app/api/public/assistant-preview/route.test.ts \
  src/app/page.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Results:

- Focused tests: 14 passed (2 resolver + 5 route + 7 landing).
- Typecheck: passed (`tsconfig.build.json` gate; raw `npx tsc --noEmit` is intentionally not a gate — `INCIDENT-BUILD-raw-tsc-test-fixtures`).
- Lint: passed, no ESLint warnings or errors.
- `git diff --check`: clean for touched files.
- Browser (Chromium, desktop 1440 + mobile 390): prompts return deterministic answers via `/api/public/assistant-preview`; the `.card-overlay` dim activates on details-open and on the formed state; title/sphere/card geometry is unchanged across "More info", prompt click, and sphere activation (no layout shift); the DOM exposes no `/api/broker/copilot` or `/api/broker/voice/token`.

### Deployment notes

No migration, API contract change to existing routes, auth change, or environment variable change. Adds one new public, unauthenticated, deterministic route (`/api/public/assistant-preview`) that returns only approved static strings. Rollback: remove `PublicAssistantPreview`, the route, and the `PUBLIC_ASSISTANT_PROMPTS` constant; no data/auth/env rollback required.
