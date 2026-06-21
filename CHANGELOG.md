# Changelog

All notable changes to FixtureLog are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## [1.5.0] — 2026-06-20 (Sanctions / Operator-Risk Screening Gate)

FixtureLog gains the first deterministic sanctions/operator-risk slice: local normalized fixture data, provenance-carrying screening evidence, compact broker-facing badges, and a hard pre-`FIXED` gate.

### Added

- **Additive screening model** — `Operator`, `ScreeningResult`, `ScreeningReview`, `Vessel.flagState`, and provenance cache fields on `Vessel`, `Owner`, `Operator`, and `Charterer`. `ScreeningResult` is the source of truth; cache fields exist only for fast badges.
- **Local normalized fixture adapter** — deterministic demo records behind a Zod-parsed screening boundary, with 24-hour TTL and explicit source/list/version metadata.
- **Pure screening service** — classifies vessel-by-IMO, owner, operator, and charterer subjects as `CLEAR`, `REVIEW`, or `BLOCKED`; derives `STALE`; and prevents broker-clearing of true `BLOCKED`.
- **Pre-`FIXED` sanctions gate** — `PATCH /api/fixtures/[id]/status` and the copilot `advanceFixtureStatus` executor both call the same screening gate before persisting `ON_SUBS → FIXED`.
- **Broker-facing badges** — requirement list, dashboard active-enquiry rows, and fixture timeline rows show compact screening state. The close-action button warns/disables when cached screening already says `BLOCKED`, `REVIEW`, `STALE`, or `SOURCE_ERROR`.
- **Copilot evidence boundary** — the broker data summary now includes stored screening status/timestamps/source; the system prompt allows evidence summaries but forbids legal conclusions, external lookups, overrides, or clearing true `BLOCKED`.

### Safety

- No `CLEAN_FIXED` enum was added; locked fixture/requirement status vocabulary remains unchanged.
- No yente, direct government ingestion, AIS, voice/RAG, legal advice, autonomous clearing, or broker override for true `BLOCKED`.
- Targeted verification: sanctions service tests, status route tests, copilot status executor tests, broker dashboard mapper tests, full typecheck, and lint.

## [1.4.3] — 2026-06-20 (Public build lock)

### Added

- Added `BuildStatusPanel`, a build-status disclosure panel for the public build page.
- Added `JuniorVoiceAssistant`, a supervised particle preview for the junior assistant experience. It now supports the public message that two assistants are being prepared: one for chartering handoffs and one for vessel matching, with a short preview-only voice identity line. It does not request microphone access, call the LiveKit voice backend, or expose `/api/broker/voice/token`.
- Added focused unit coverage for the locked landing and legacy `/page2` redirect.

### Changed

- Replaced the public `/` product landing with a professional private-build page that says two junior assistants are being built for chartering and matching, with selectable build signals and no public links to `/dashboard`, `/portal`, `/requirements`, `/charterers`, or `/map`.
- Refined the assistant area into one integrated preview card: projected 3D dot sphere, in-card build-status disclosure, stable section dividers, shorter status label, subtle active border, explicit `.card-overlay` dimming while the card keeps its color, and reserved right-side geometry so the voice, title, and extra-information sections do not move when "More info" opens.
- Shortened the public brand label to `ManuMu Offshore`.
- Redirected the old experimental `/page2` landing to `/`.
- Updated Playwright landing E2E and refreshed desktop/mobile landing screenshots.
- Updated current-state docs and package metadata to `1.4.3`.

### Added — Limited public assistant preview (2026-06-21)

- Added a deterministic limited public assistant preview inside the landing assistant card: curated prompt buttons call `POST /api/public/assistant-preview` and return approved public-context answers only. It does not expose broker data, broker tools, writes, microphone access, LiveKit, RAG, an LLM call, or `/api/broker/copilot`. It is deterministic and public-safe — **not live voice, not RAG, and not the full broker copilot**.
- Added `src/lib/public-assistant/public-assistant-preview.ts` — a deterministic answer map keyed by four curated prompt IDs (`what-building`, `broker-help`, `matching-help`, `why-private`), returning a scoped `400` safe message for unknown IDs.
- Added `src/app/api/public/assistant-preview/route.ts` — a public, Zod-validated `POST` endpoint, with route tests and import-safety tests proving it never imports broker copilot, broker auth, voice/LiveKit, or dashboard modules.
- Added `src/components/landing/PublicAssistantPreview/` — a compact prompt/answer card UI (curated buttons, loading state, transcript-style answer, safe error fallback) with a Zod boundary on the response. No free-text input.
- Integrated the preview into the existing assistant card after `BuildStatusPanel` and reserved the card height so opening "More info" or asking a prompt does not move the sphere, title row, or card (verified on desktop and mobile).

## [1.4.2] — 2026-06-17 (Landing role comparison)

### Added

- Added a public landing `RoleComparison` section with a Broker / Charterer segmented toggle, showing the different home routes, responsibilities, and scoped data views for `/dashboard` and `/portal`.
- Added landing coverage for the role comparison copy in `src/app/page.test.tsx`; full unit suite now passes with 375 tests across 60 files.

### Changed

- Removed the decorative CTA footer overlay so the landing no longer carries the extra visual pattern treatment.
- Updated current-state docs and package metadata to `1.4.2`.

## [1.4.1] — 2026-06-16 (Landing logo animation polish)

### Fixed

- Rebuilt the public landing nav logo animation from the actual FixtureLog mark rather than the simplified three-path draft. The animated SVG now draws the circular mark plus two separated incomplete capital-M strokes, one upright and one flipped.
- Matched the OR Studio animation choreography more closely with a completed-mark reveal under the stroke-draw animation, while keeping the implementation on `motion.path` so existing landing tests continue to pass.
- Added global ESLint ignores for generated/vendor output (`.next`, coverage reports, Playwright output, local virtualenvs, `next-env.d.ts`) so `npx eslint . --ext .ts,.tsx` validates source files instead of build artifacts.

## [1.4.0] — 2026-06-15 (AI Broker Copilot v2 — grounded, confirm-gated agent)

The AI Broker Copilot graduates from a **grounded read-only chat** to a **grounded, confirm-gated, tool-using agent**. It keeps every v1 guardrail (broker-only, fed the desk's real dashboard aggregate as the source of truth, answers only from that data) and gains the ability to *act* — with a human checkpoint on every mutation.

### Added

- **Tool-using agent** — the copilot route runs a **bounded** multi-step loop (`stopWhen: stepCountIs`) over four broker-scoped tools. `brokerId` is session-derived (from `requireBrokerApi`), never a tool argument, so the model cannot spoof which desk it acts on.
- **Read tools auto-run** — `getFixture` and `findMatches` execute inside the loop with no confirmation (no side effects); thin wrappers over the existing query + matcher services.
- **Write tools are proposed, never auto-run** — `advanceFixtureStatus` and `generateRecap` are **approval-gated**: the model can only *propose* the action with a plain-language summary, and the write runs **only after the broker clicks Approve**. Reject denies it; nothing mutates.
- **Approve / Reject UI** — the broker copilot panel renders read-tool steps inline and surfaces each proposed write as a card with an explicit Approve / Reject control.
- **The guarantee, proven by test** — `copilot-agent.test.ts` drives the real bounded loop with a deterministic mock model: a proposed write does **not** call the executor; on approval it runs **exactly once**; on rejection it never runs. `copilot-agent-subject-gate.test.ts` proves an approved-but-illegal `ON_SUBS → FIXED` is still blocked by the subject-lift gate (the DB transaction never runs).

### Safety

- **The deterministic policy is the only door to the DB.** A gated write's `execute` calls the same broker-scoped executor the existing routes use (`evaluateTransition` legal-transition matrix + subject-lift gate; recap FIXED/COMPLETED precondition). An approved-but-illegal write is rejected and relayed as a message; nothing mutates.
- **Bounded + capped.** The loop is step-capped; message history size and total characters are capped before any model call.

### Changed

- The README's stale "runtime AI Broker Copilot dropped" line is corrected to describe the shipped grounded, confirm-gated copilot.

Decision record: **[ADR-0004](docs/decisions/ADR-0004-copilot-human-in-the-loop.md)** — the model proposes, the broker disposes.

## [1.3.0] — 2026-06-14 (Client Portal + Broker Dashboard)

FixtureLog becomes a **two-sided product**: a charterer (client) portal and a broker dashboard, both authenticated and role-gated on top of the v1.2.0 `AppUser` identity.

### Added

- **Charterer Client Portal** (`/portal/*`) — six server-rendered, charterer-scoped surfaces: **Dashboard** (active enquiries, pending actions, fixture/weather timeline), **Create Enquiry** (deterministic Zod-validated form), **My Enquiries** + detail with a recommended-vessel **shortlist** (reuses the broker matcher read-only), **Fleet Explorer** (the reused Leaflet map + a vessel gallery + a shared modal — a marker and a card open the same `VesselModal`), **My Fixtures**, and **Documents** (recap copy/download).
- **Broker Dashboard** (`/dashboard`, broker home) — the same three dashboard zones fed by a **broker-wide** aggregate (every charterer's queue), reusing the portal component kit unchanged. The broker home moved from the bare `/requirements` list to `/dashboard`.
- **Role-based identity** — `AppUser` gains `role` (`AppRole` = BROKER | CLIENT) + `chartererId`; `Vessel` gains honesty-labelled image fields (`imageUrl`, `images`, `imageSource` (`VesselImageSource`), `imageCredit`). Migration `client_portal`.
- **Auth guards** — `require-charterer.ts` (charterer page/API guards + first-login provisioning: match `Charterer.contactEmail`, dev auto-links the demo charterer), `require-broker.ts` (broker mirror), `resolve-role.ts` / `resolve-home-route.ts`, and a `/api/auth/post-login` hop that routes each role to its home (charterer → `/portal`, broker → `/dashboard`).
- **Portal API** — charterer-scoped `/api/portal/{dashboard,enquiries,enquiries/[id],fixtures,documents}` (401 anonymous, 403 broker, 404 cross-charterer) and broker-wide `/api/broker/dashboard` (403 charterer). Every response Zod-validated.
- **Design kit** (`src/components/portal/`) — token-only shared primitives: `PortalShell`, `PortalNav` (parameterized for broker/charterer, with a visible federated sign-out), `PortalPageHeader`, `PortalButton`, `PortalCard`, `StatusBadge`, `EmptyState`, `Modal` + `Lightbox` (adapted from OR_Studio into CSS Modules + `--fl-*` tokens).
- **Vessel imagery** — two honesty-labelled tiers under `public/assets/vessels/`. 21 demo vessels whose names match real offshore ships now carry a **CC-licensed photograph of the real, same-named vessel** from Wikimedia Commons (`public/assets/vessels/real/`, `imageSource=WIKIMEDIA`), each credited with author + licence and the line "a real vessel of the same name, not this demo vessel"; 16 of those are also paired with the vessel's **real IMO** (a public-registry fact). The remaining 9 keep the per-type **house-art SVG** (`imageSource=STOCK`, "representative illustration, not a photo of the named vessel") — including 4 vessels whose only Commons match was an unrelated/incidental ship, deliberately left as SVG rather than mislabelled. MMSI and specs stay synthetic for every vessel. (Images downscaled to ≤1440px for the web.)
- **Landing reconciliation** — role-based redirect via the post-login hop, a public **Fleet teaser** section, and the `AuthCta` refactored to `--fl-*` tokens (matches the portal `PortalButton`).
- **Demo seed** — the demo charterer (Equinor) now has a full arc (shortlisted enquiry + ON_SUBS fixture with subjects/marginal weather + FIXED fixture with recap/workable weather), so a charterer login shows a complete story.

### Changed

- The `AppUser` model now maps an OIDC identity to **either** a `Broker` (role BROKER) **or** a `Charterer` (role CLIENT); `role` drives the home route and data scope.
- Landing auth CTA for authenticated visitors links to the role-aware `/api/auth/post-login` hop instead of `/requirements`.
- `/map` now sorts real-photo vessels first and places stock/no-image vessels last; the vessel modal shows `Use in enquiry` only for client sessions, not brokers.
- Total unit tests: 343 across 52 files. Coverage: 79.03% statements / 72.97% branches / 72.14% functions / 79.03% lines. E2E: 7 across 4 specs. Production build, lint, typecheck, and `npm audit` (full + prod) all pass.

### Notes

- The portal renders only the logged-in charterer's own data, proven isolated by test (cross-charterer reads 404). The whole fleet is visible read-only in Fleet Explorer; the portal has no write path to vessels/owners/other charterers.
- The AI Broker Copilot is **dropped** from the roadmap; this release delivers the two-sided product instead.

---

## [1.2.0] — 2026-06-14 (Auth Integration)

### Added

- **Authentication via the shared ManuMuStudio OIDC provider** (Auth.js / NextAuth v5 beta). `src/features/auth/` holds the NextAuth config (provider id `manumustudio`, JWT sessions, federated sign-out), client-safe `useSession`, and the sign-in/sign-up server actions.
- **Split environment validation** — `src/lib/env.ts` (client-safe) and `src/lib/env.server.ts` / `env.server.schema.ts` (`server-only`, with a production placeholder guard) keep auth secrets out of the client bundle.
- **Route protection** — operational pages moved into an authenticated `src/app/(app)/` route group whose layout calls `requireSession()` (redirects anonymous visitors to `/`); URLs are unchanged. New `src/lib/auth/require-session.ts` exposes `requireSession()` (pages) and `requireApiSession()` (401 JSON for APIs).
- **API gating** — all 21 domain route handlers now require a session; `/`, `/api/auth/*`, and `/api/health` stay public. A cookie-forwarding `src/lib/server-fetch.ts` lets server components reach their own gated APIs as the signed-in user.
- **Domain identity + actor model** — new `AppUser` Prisma model mapping OIDC `externalId` → `Broker` (migration `auth_integration`). `src/lib/auth/provision-actor.ts` provisions an `AppUser` on first access and resolves the broker (link by email; dev/demo auto-creates; production refuses with 403).
- **Auth CTAs on the landing** — new `AuthCta` server component: anonymous visitors see Sign in / Create account (server actions), authenticated visitors see Go to Workspace → `/requirements`.
- **`src/middleware.ts`** — baseline security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS), edge-safe and excluding `/api/auth/*` and static assets.
- Tests: `require-session`, `provision-actor`, and `AuthCta` unit tests, plus impersonation-prevention cases for `POST /api/fixtures` and `PATCH /api/fixtures/[id]/status`. Vitest aliases `server-only` and `@/features/auth/auth` so route handlers test without loading next-auth.

### Changed

- **Actor identity now comes from the session, not the request body.** `POST /api/fixtures` resolves the broker from the session (body `brokerId` removed/ignored) and `PATCH /api/fixtures/[id]/status` writes the audit actor from the session (body `actor` removed/ignored) — a caller can no longer impersonate another broker.
- Landing copy no longer claims "no account required / all routes public"; the final CTA band now drives sign-in.
- Playwright `webServer` runs with `E2E_TEST_USER=true` so the auth bypass keeps gated routes reachable in E2E.
- Total unit tests: 279 across 35 files. E2E: 7 tests across 4 specs.

### Notes

- The deployed `auth.manumustudio.com` issuer and the FixtureLog `OAuthClient` (scopes openid/email/profile) were registered ahead of this packet.
- Runtime AI Broker Copilot remains unbuilt; auth is its prerequisite (SPEC-002).

---

## [1.1.0] — 2026-06-14 (Public Landing Page)

### Added

- Public FixtureLog landing page at `/` with maritime editorial styling (SSY-inspired navy/cyan palette, Fraunces display-serif + Geist sans), an animated marine-chart hero canvas, feature showcase, how-it-works workflow steps, tech badges, final CTA band, and portfolio-safe footer.
- `src/components/landing/` — eight landing components following the 4-file pattern: `LandingNav`, `LandingHero`, `MarineTrafficCanvas`, `FeatureShowcase`, `HowItWorks`, `TechBadges`, `CtaFooter`, `LandingFooter`.
- `src/lib/constants/landing-copy.ts` — single source of truth for all landing copy; no copy is hard-coded in components.
- CSS design tokens for landing palette, typography, borders, surfaces, and motion durations in `src/app/globals.css`.
- `motion@^12` dependency added — used for staggered hero entrance, `whileInView` feature-row reveals, scroll-drawn how-it-works connector, and badge stagger. Canvas animation uses raw `requestAnimationFrame`.
- Marine hero canvas (`MarineTrafficCanvas`) — procedural vessel tracks, port nodes, route/laycan arcs, and a cyan route ribbon. Reduced-motion safe; CTA hover increases canvas intensity.
- Landing unit tests: `src/app/page.test.tsx` (15 tests covering copy, links, disabled auth teaser, and no-auth-route guarantees).
- Landing E2E spec: `e2e/landing.spec.ts` (3 tests covering desktop/mobile render, route navigation, and non-blank canvas).
- Landing screenshots: `public/assets/landing/landing-desktop-1440.png` and `landing-mobile-390.png`.

### Changed

- `/` now presents FixtureLog as an offshore fixture workflow demo with animated marine canvas instead of a plain navigation list.
- Proof-strip unit-test count corrected to 264 (from stale 250+) in `src/lib/constants/landing-copy.ts`.
- README, roadmap, project context, AI usage, and CONTEXT now describe the polished public landing as current state at v1.1.0.
- Total unit tests: 264 across 31 files. E2E specs: 4.

### Notes

- Auth integration remains a separate future release (v1.2.0). No `next-auth`, OAuth, sessions, middleware, `AppUser` model, or `/api/auth/*` routes were added.
- Runtime AI remains unbuilt. SPEC-002 is still the planned copilot architecture.
- Design is a hybrid: Helical Bio Explorer motion pattern (primary) + SSY editorial skin (navy `#000061` / cyan `#00e2fd` / white). SSY is used as a style reference only — no SSY branding, logo, or affiliation claim.
- `docs/research/SSY-GLOBAL-LANDING-CSS-PATTERN-REPORT.md` was the design input for palette, typography, and editorial spacing cues.

---

## [1.0.1] — 2026-06-14 (Docs: AI Broker Copilot Safety Spec)

### Added

- `docs/specs/SPEC-002-ai-broker-copilot.md` — future AI Broker Copilot architecture and safety spec: LLM as interface, backend/tools as source of truth, typed tool contracts, HITL write gates, provider-neutral `ToolResult`, risk model, eval strategy, and future audit/data model.
- `docs/research/AI-BROKER-COPILOT-RESEARCH.md` — cleaned research source covering Vercel AI SDK orchestration, structured outputs, tool calling, Langfuse/Braintrust observability, eval strategy, Open-Meteo caveats, and human confirmation flow.
- `docs/pull-requests/PR-1.0.1.md` and `docs/journal/ENTRY-006.md` for the docs-only spec packet.

### Changed

- README, roadmap, project context, AI usage, and local context now describe the copilot as planned, not built.
- Public/current-state docs now use public feature wording instead of internal `PACKET-NNN` labels.
- Glossary now includes the `OTHER` vessel type, matching the nine vessel-type enum values documented in the MVP.

### Notes

- No runtime AI was added.
- No source code, Prisma schema, dependencies, environment variables, package lock, or `package.json` version were changed. `package.json` remains `1.0.0`; `1.0.1` is a changelog/PR/journal docs anchor only.

---

## [1.0.0] — 2026-06-13 (MVP: Regional Map + Vessel Positions + Deploy)

### Added

- Regional Leaflet map at `/map`: color-coded `CircleMarker` per vessel, popup with name, type, owner, status, port (when present), source, and confidence; `SEEDED` label in the page header makes the data provenance clear. No Leaflet icon assets — hermetic by design.
- `GET /api/vessels/positions` — lightweight endpoint returning the latest position snapshot per vessel; Zod-validated response schema (`VesselPositionItem`) sourced from `src/lib/validators/vessel-position.validators.ts`.
- `src/features/map/` feature slice: `api.ts` (Zod-parsed fetch helper), `hooks/useRegionalMap.ts` (data fetching + loading/error state), `VesselMarker/` (CircleMarker + popup), `RegionalMap/` (presentational Leaflet map), `RegionalMapClient/` (client component; owns hook; lazy-loads `RegionalMap` via `next/dynamic` with `ssr: false`).
- `src/app/map/page.tsx` — server component with `metadata`; renders `RegionalMapClient`.
- Real landing page at `/` replacing the Next.js default (`src/app/page.tsx`): introduces FixtureLog to visitors with navigation links to the key sections.
- `docs/GLOSSARY.md` — offshore shipbroking glossary (domain terms + app-specific terms); all 9 vessel-type abbreviations (PSV, AHTS, MPSV, CSV, ERRV, DSV, CTV, SOV, OTHER).
- `docs/AI-USAGE.md` — honest account of AI-assisted development workflow and confirmation that no AI runs at runtime.
- Comprehensive `README.md` — architecture diagram, full tech stack (incl. Leaflet + OpenStreetMap), complete project structure tree, all 21 API endpoints, services documentation, getting started guide, deployment runbook.
- `NEXT_PUBLIC_APP_URL` in `.env.example` — required for server components to build absolute fetch URLs in production.
- `postinstall: prisma generate` in `package.json` — ensures the Prisma client is generated after `npm install` on deploy platforms.
- leaflet `^1.9.4` and react-leaflet `^5.0.0` in `dependencies`; `@types/leaflet` in `devDependencies`.
- `e2e/map.spec.ts` — hermetic map E2E; OSM tile requests are aborted so the test never hits the network; asserts vessel markers render.

### Quality Gates

- ~10 unit tests added this packet; 250 total across 30 files.
- Coverage: above thresholds (70/60/70/70) despite `useRegionalMap` and `RegionalMapClient` being covered by E2E rather than unit tests.
- TypeScript: 0 errors; ESLint: 0 errors.
- First Load JS shared: 103 kB (budget < 200 kB); `/map` route 118 kB (Leaflet + react-leaflet in a separate dynamic chunk, not in the shared bundle).
- E2E: 4 specs (2 smoke + 1 happy-path + 1 map).
- No Prisma migration — `PositionSnapshot` existed in the v0.3.0 schema; no schema changes in this packet.

### Deferred

- Port markers (SPEC-001 §4.8) — the spec mentions vessel AND port markers; port markers are deferred in
  v1.0.0 because the schema has no standalone Port model with coordinates (ports are string fields). Vessel
  markers only in v1.0.0. Future: derive port locations from PositionSnapshot.portName + lat/lng or a static map.

---

## [0.5.0] — 2026-06-12 (Weather Enrichment + Happy-Path E2E)

### Added

- Open-Meteo Marine weather proxy: `GET /api/weather/marine?lat=&lng=` with 5-minute in-memory TTL cache; SSRF-safe Zod-validated coordinates; `current`-conditions source (not `hourly[0]`) so the values represent the present moment, not midnight
- `computeVerdict()` pure function producing a workability verdict (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`) from North Sea thresholds (wave height, swell height, wind-wave height)
- `WeatherEnricher` service — thin layer wrapping the Open-Meteo fetch + TTL cache; no database calls
- Zod validator module `weather.validators.ts` covering query params, external-response schema, and snapshot shapes
- `POST /api/fixtures/:id/weather` — persists a `WeatherSnapshot` linked to the fixture and returns the snapshot with `fixtureId`; ad-hoc lookups via the proxy route return `fixtureId: null`
- `GET /api/fixtures/:id` now includes `weatherSnapshots` in the response
- 2 seeded `WeatherSnapshot` rows attached to fixture2 and fixture3 for hermetic testing
- `e2e/happy-path.spec.ts` — first full-workflow broker E2E: requirement creation → matching → fixture creation → weather snapshot verification → subject creation + lift → `ON_SUBS → FIXED` transition → recap generation; hermetic via seeded data (zero live Open-Meteo calls)

### Quality Gates

- 42 unit tests added this packet; 239 total across 26 files
- Coverage: 94.92% statements / 85.03% branches / 93.61% functions / 94.92% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS shared: 102 kB (budget < 200 kB)
- No Prisma migration — `WeatherSnapshot` existed in the core-vertical-slice schema; no schema changes in this release

---

## [0.4.0] — 2026-06-12 (Requirement Matching)

### Added

- FixtureMatcher: two-stage (hard filter + weighted score) vessel matching engine (`src/lib/services/fixture-matcher.ts`)
- Haversine great-circle distance utility returning nautical miles (`src/lib/utils/haversine.ts`)
- DP class comparison utility — rank, meets-minimum, and headroom helpers; `NONE < DP1 < DP2 < DP3` (`src/lib/utils/dp-class.ts`)
- Requirement CRUD: `POST /api/requirements`, `GET /api/requirements`, `GET /api/requirements/[id]`
- `POST /api/requirements/[id]/match` — runs the two-stage matching engine; returns a ranked shortlist with per-factor breakdown (`distance`, `rateFit`, `capabilityMargin`)
- `ENQUIRY → SHORTLISTED` status transition on first match; re-match on `SHORTLISTED` (or any later status) returns actual status unchanged
- Tunable scoring weights (default: distance 0.40, rateFit 0.35, capabilityMargin 0.25); weights reflected in `MatchResponse.weightsUsed`
- Zod validation at all requirement API boundaries: create body, list query params, match-request weights (sum-to-1.0 refine — invalid weights return HTTP 400)
- `/requirements` page: server-component requirement list with status badges
- `/requirements/[id]` page: server-component shortlist detail with per-factor score breakdown; `ShortlistView` presentational component extracted

### Quality Gates

- 98 unit tests added this packet; 197 total across all files
- Coverage: 94.76% statements / 84.52% branches / 92.68% functions / 94.76% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS (`/requirements` pages): 106 kB (102 kB shared baseline; budget < 200 kB)
- No Prisma migration (no schema changes in this release)

---

## [0.3.0] — 2026-06-12 (Core Vertical Slice)

### Added

**API Routes (14 new dynamic routes)**
- `GET /POST /api/charterers` — list charterers; register a charterer with optional contact fields
- `GET /api/charterers/[id]` — charterer detail
- `GET /api/charterers/[id]/requirements` — requirements linked to a charterer
- `GET /api/charterers/[id]/fixtures` — fixtures linked to a charterer
- `GET /api/vessels` — list vessels (filterable by type, region, availability)
- `GET /api/vessels/[id]` — vessel detail
- `GET /POST /api/fixtures` — list fixtures; create a fixture
- `GET /api/fixtures/[id]` — fixture detail
- `PATCH /api/fixtures/[id]/status` — transition fixture status (subject-gated on `ON_SUBS → FIXED`)
- `POST /api/fixtures/[id]/recap` — generate and persist a deterministic SUPPLYTIME 2017 recap
- `POST /api/fixtures/[id]/subjects` — add a subject to a fixture
- `PATCH /api/fixtures/[id]/subjects/[subjectId]` — update subject status (`LIFTED` / `WAIVED`)

**Services**
- `FixtureStatusPolicy` — pure service enforcing the canonical status machine; subject-gated `ON_SUBS → FIXED` (requires ≥1 subject with every subject `LIFTED` or `WAIVED`); returns 400 with outstanding-subject count on rejection; writes a `FixtureStatusChange` audit row on every transition; stamps `Fixture.fixedAt` on transition to `FIXED`
- `RecapFormatter` — pure service producing deterministic SUPPLYTIME 2017 recap in Markdown + plain text; no runtime LLM

**Validators**
- Zod validator modules for charterer, vessel, fixture, and subject boundaries — all route handlers parse request input through these schemas (resolves carry-forward W2)

**UI Pages**
- `/charterers` — charterer list (Next.js 15 server component)
- `/charterers/[id]` — charterer detail with linked requirements and fixtures (Next.js 15 server component)

**Schema**
- `SubjectItemStatus` Postgres enum (`PENDING`, `LIFTED`, `WAIVED`) — replaces plain string on `SubjectItem.status` (resolves carry-forward N1)
- `FixtureStatusChange` audit model — immutable per-transition record (actor, fromStatus, toStatus); indexed on `fixtureId`; cascades on delete
- `Charterer` contact columns — `contactName`, `contactEmail`, `contactPhone` (optional, non-destructive migration)
- Migration: `prisma/migrations/20260612150000_vertical_slice_subjects_audit_contact`

**Infrastructure**
- Node.js ≥20 pinned via `package.json` `engines` and `.nvmrc 20.20.2` (resolves INCIDENT-P01-vitest-esm-startup)
- `import 'server-only'` added to `src/lib/prisma.ts` (resolves carry-forward N3)
- Coverage config extended to include `src/app/api/**`

### Fixed
- `INCIDENT-P01-vitest-esm-startup` — Vitest ESM startup failure on Node 18; resolved by pinning Node 20
- `INCIDENT-P01-npm-audit-critical-dev` — `happy-dom` high-severity audit failure; resolved by removing unused dependency

### Quality Gates
- 99 unit tests across 15 files; all passing
- Coverage: 95.3% statements / 82.8% branches / 95.5% functions / 95.3% lines (thresholds 70/60/70/70)
- TypeScript: 0 errors; ESLint: 0 errors
- First Load JS shared: 102 kB (budget < 200 kB)

---

## [0.2.0] — 2026-06-11 (Spine Foundation)

### Added
- Next.js 15 project initialized with App Router and strict TypeScript
- Prisma schema: 13 models, 12 enums matching SPEC-001 sections 2-3
- Initial database migration for all tables
- Idempotent seed: 30 vessels across 6 types, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 rate benchmarks, 4 requirements, 3 fixtures, subject items, recap
- Health endpoint (`/api/health`) with extracted testable helper
- Unit tests for health check logic (Vitest)
- E2E smoke tests (Playwright — homepage + health endpoint)
- Vitest configuration with coverage thresholds (70/60/70/70)
- Playwright configuration with global DB seed setup
- 4-job CI pipeline: lint-typecheck, test-coverage, build-bundle, e2e
- Dual npm audit (full + prod-only) in CI
- Bundle size budget enforcement (200 kB First-Load JS)
- ESLint flat config with complexity caps (300 lines, 80/function, complexity 15, depth 3, params 4)
- `.env.example` template

---

## [0.1.0] — 2026-06-11 (Project Spec & Decisions)

### Added
- `docs/decisions/ADR-0002-data-and-integration-strategy.md` — data & integration strategy.
- `docs/decisions/ADR-0003-application-architecture.md` — application architecture.
- `docs/specs/SPEC-001-mvp-build.md` — MVP build spec (scope tiers, canonical status enums, data model, feature contracts, CI/CD, build sequence).
- `docs/journal/ENTRY-001.md` — consolidated packet journal entry.

### Decided
- **Architecture:** Next.js full-stack (App Router + Route Handlers, Node runtime) + service layer (`FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, `FixtureStatusPolicy`); one Vercel deploy unit (ADR-0003).
- **Canonical status enums:** `Fixture.status` = `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED` (+ `FAILED`); `Requirement.status` = `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED` (+ `LOST`) (SPEC-001 §2).
- **Data strategy:** seeded Postgres + Open-Meteo Marine as the one real API; AIS deferred; weather persisted as decision-time snapshots; honesty rule via `source`/`confidence` (ADR-0002).
- **Matching:** `FixtureMatcher` is core (hard filters + weighted 0–100 score); Haversine distance core, PostGIS a post-MVP stretch.
- **Recap:** deterministic SUPPLYTIME formatter (Markdown + plain text), no runtime LLM.
- **CI/CD:** mirrors `learning-speaking-app` 1:1 (lint-typecheck · test-coverage · build-bundle · Playwright e2e) + Vercel per-PR previews.
- **Deploy target:** Vercel + Neon (Postgres-only; Python FastAPI service excluded from MVP).

---

## [0.0.0] — 2026-06-11 (research/planning foundation)

### Added
- Research foundation under `docs/research/`:
  - `SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md` — synthesised domain reference.
  - `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md` — recommended project, data model, pages/routes, build plan, worked pipeline example.
  - `SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` — real-vs-mock data strategy, API inventory, stack, deployment, seed figures.
  - `SSY-OFFSHORE-GLOSSARY.md` — plain-English glossary + cheat sheet.
- Methodology scaffolding: `docs/architecture/PROJECT-CONTEXT.md`, `docs/decisions/ADR-0001-research-first-methodology.md`, consolidated journal entry, `docs/roadmap/ROADMAP.md`, and project rules.
- `README.md` (project overview, status, research index, methodology).

### Notes
- **No application code, packages, or frameworks** — research-first by design (ADR-0001).
- Source research citation markers stripped; confidence tags (`CONFIRMED`/`[LIKELY]`/`[INFERENCE]`/`[UNVERIFIED]`) preserved.

---

_0.1.0 is a documentation/spec milestone — no application code yet. The first **code** release will follow the first build packet (see `docs/roadmap/ROADMAP.md`)._
