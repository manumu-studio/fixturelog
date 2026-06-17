# FixtureLog — Technical Interview-Prep Report

> Paste this whole file into a claude.ai chat as context, then ask it to quiz you and find your weak spots. See the "How to use this" note at the bottom.
>
> This report is deliberately honest, not flattering. Its job is to surface every place you could get caught or pressed, so read the weak-spot sections as hard as the explanations. No em dashes are used.

---

## 1. Overview

FixtureLog is a single-deploy **Next.js 15 full-stack app** (App Router, Node runtime route handlers, not edge) for the **offshore marine chartering / shipbroking** domain. A broker desk takes a charterer's enquiry (a "requirement"), matches it against a pool of vessels, negotiates a deal (a "fixture"), works through contractual conditions ("subjects"), fixes the deal, and generates a contract recap. The stack is React 19, TypeScript strict, Zod ^3 at every boundary, Prisma ^6 against **PostgreSQL 16 on Neon**, Auth.js / NextAuth ^5-beta with a custom OIDC provider and JWT sessions, Leaflet for the map, and the Vercel AI SDK (`ai ^6` + `@ai-sdk/anthropic`) for the broker copilot. It deploys on Vercel. The codebase leans hard on a "functional core, imperative shell" split: the domain logic (matcher, status policy, recap formatter, weather verdict) is pure deterministic TypeScript with no I/O, and the route handlers are thin shells that do auth, validation, DB access, and side effects.

---

## 2. Architecture and request pipeline

The pipeline is **middleware → page layout guard OR API handler guard → service layer → Prisma → Postgres**. Three layers, each with a distinct job.

**1. Middleware** (`src/middleware.ts:17-28`) is intentionally minimal. It only stamps baseline security headers (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS) onto every non-auth, non-static response. The matcher (`middleware.ts:27`) excludes `/api/auth`, `_next/static`, `_next/image`, `favicon.ico`. The header comment (`middleware.ts:1-8`) is explicit: middleware does **no auth gating** and must not import `server-only`/`env.server`, because middleware runs in the **edge runtime** which cannot run those. There is deliberately **no CSP** (would need per-page nonces and would break Leaflet tiles and the Next inline runtime). Auth is enforced deeper, not at the edge.

**2a. Page auth (route-group layout guard).** Authenticated pages live in the `(app)` route group. `src/app/(app)/layout.tsx:9-11` calls `requireSession()` then `resolveHomeRoute(user)`, rendering the broker shell (`/dashboard`, `BROKER_NAV_ITEMS`) or the client shell. `requireSession()` (`require-session.ts:27-33`) reads identity only from `auth()` (never parses cookies) and `redirect('/')` for anonymous visitors. The charterer portal lives under `/portal` (separate tree) gated by `requireCharterer()`.

**2b. API auth (per-handler guards).** Every protected route handler calls a guard as its first line and returns the guard's `NextResponse` on failure, using a discriminated union `{ ok: true } | { ok: false, response }`. Three guards:
- `requireApiSession()` (`require-session.ts:36-47`) → 401 for anonymous. Used by read endpoints and the weather snapshot endpoint.
- `requireBrokerApi()` (`require-broker.ts:50-75`) → 401 anonymous, 403 charterer, 403 unprovisioned. Used by all broker mutations.
- `requireChartererApi()` (`require-charterer.ts:129-157`) → 401 anonymous, 403 broker, 403 unmapped client. Used by all `/api/portal/*`.

**3. Service layer (pure TS).** Handlers stay thin and delegate domain logic to pure, DB-free, deterministic functions: `FixtureMatcher` (`fixture-matcher.ts`), `FixtureStatusPolicy` (`fixture-status-policy.ts`), `RecapFormatter` (`recap-formatter.ts`), `WeatherEnricher` / `computeVerdict` (`weather-enricher.ts`, `weather-verdict.ts`). For the portal, query helpers in `lib/services/portal/` own all Prisma access so handlers do not.

**4. Prisma → Postgres.** A single hot-reload-safe singleton (`src/lib/prisma.ts:5-11`): a global cached client in non-prod to survive Next dev hot reloads. `import 'server-only'` guarantees it can never be bundled into a client component.

**serverFetch / server-origin.** Server Components render before there is a browser to carry cookies, so a naive `fetch('/api/...')` from a Server Component hits the gated route with no session and gets 401. `getRequestOrigin()` (`src/lib/server-origin.ts`) builds an absolute origin from `x-forwarded-host`/`x-forwarded-proto` (falling back to `NEXT_PUBLIC_APP_URL`), and `serverFetch(path, init)` (`src/lib/server-fetch.ts`) forwards the incoming `cookie` header from `next/headers` and sets `cache: 'no-store'`. That is what lets a broker page call its own gated API with the session riding along; the response is Zod-parsed in the page.

**Representative full trace — `PATCH /api/fixtures/:id/status`** (`status/route.ts`):
1. `requireBrokerApi()` guard (line 15) → 401/403.
2. `CuidParamSchema` validates the route param; `FixtureStatusTransitionSchema` validates the body (lines 19-34).
3. Load fixture plus its subjects' statuses (lines 39-42).
4. `evaluateTransition(fixture.status, toStatus, { subjectStatuses })` — the pure policy decides legality (lines 48-52).
5. On success, a `prisma.$transaction` (lines 58-85) atomically updates `Fixture.status` (plus `fixedAt` if → FIXED), writes a `FixtureStatusChange` audit row with `actor: guard.ctx.brokerId` (from the session, never the body), and, if → FIXED, propagates `status: FIXED` onto the linked `Requirement`.

### Likely interview questions (architecture)
1. Why is auth enforced in the layout/handler and not in middleware? (Edge runtime cannot run `server-only`/Prisma; middleware is header-only.)
2. Why no CSP, and what would adding one cost?
3. Walk me through `PATCH /api/fixtures/:id/status` from request to commit.
4. Why route handlers in the Node runtime instead of edge?
5. Why does a Server Component need `serverFetch` rather than `fetch('/api/...')`? (No cookie context → 401; forward the cookie and build an absolute origin.)

### Honest weak spots (architecture / be ready to defend)
- **The session gate is a convention, not enforced.** Each handler must remember the four-line preamble; there is no Next middleware or wrapper that fails closed. A new route author who forgets it ships an open endpoint. Honest answer: "I would extract a `withAuth(handler)` higher-order wrapper or a fail-closed middleware matcher. Today the per-route auth tests are the safety net."
- **No CSP** (acknowledged in `middleware.ts:8`). Fine to defer, but expect "why not at least report-only?".
- **HSTS is set unconditionally even on localhost http** (harmless but technically wrong).
- **Guards do extra per-request DB round-trips** (an `AppUser.findUnique` plus `resolveActor`'s upsert). Role is not cached in the JWT, so every request re-derives it from the DB. Fine at demo scale; acknowledge it is not optimized.

---

## 3. Data model (15 tables and how they connect)

15 models, 14 enums (verified: 15 `model` blocks in `prisma/schema.prisma`). The relational spine maps directly to the broking lifecycle.

**Party / reference entities:** `Owner` (owns vessels), `Charterer` (the client), `Broker` (the desk), `Region` (7 seeded basins with center lat/lng), `Workscope` (9 operation types), `RateBenchmark` (market rate band per region + vessel type), and `AppUser` (auth identity → business actor bridge).

**The lifecycle chain is `Charterer → Requirement → Fixture → Vessel`:**
- `Charterer` raises a `Requirement` (the enquiry: region, workscope, vessel type needed, min specs, dates, budget, `RequirementStatus`).
- The matcher ranks open `Vessel`s (with `PositionSnapshot` for location); the first match flips `ENQUIRY → SHORTLISTED`.
- A `Fixture` is the agreed deal. It points back at the `Requirement` (optional FK), forward at the chosen `Vessel`, and sideways at `Charterer`, `Broker`, `Region`, `Workscope`. It carries commercial terms (agreed rate, currency, mob/demob fees, ports, commencement, `CharterPartyForm`).
- `SubjectItem` = the conditions ("subjects") that must be lifted before a deal is firm. `FixtureStatusChange` = the append-only audit trail of every transition. `Recap` = the generated SUPPLYTIME 2017 contract summary (versioned, with a `Json mainTerms` snapshot). `WeatherSnapshot` = the marine workability reading tied to the fixture's laycan.

**Cascade design (deliberate):**
- `onDelete: Cascade` on lifecycle children: `PositionSnapshot`→Vessel (285), `SubjectItem`→Fixture (364), `FixtureStatusChange`→Fixture (376), `Recap`→Fixture (393).
- `onDelete: Restrict` on every reference FK (Vessel→Owner, Fixture→Vessel/Charterer/Broker/Region/Workscope, Requirement references, RateBenchmark→Region). Protects historical commercial records from being orphaned or silently deleted.
- `onDelete: SetNull` on `AppUser.brokerId`/`chartererId` (187-188): deleting a business actor does not delete the login.
- `WeatherSnapshot.fixtureId` is nullable + Restrict (399, 412): ad-hoc weather lookups persist with `fixtureId: null`.

**Indexes match the hot query paths:** `Vessel @@index([status, openRegionId, openDate])` (270) is the matcher's hard-filter shape; `Fixture @@index([regionId, fixedAt])` (351) for dashboards; `FixtureStatusChange @@index([fixtureId, createdAt])` (378) for the audit timeline; unique on `Vessel.imo`/`mmsi`, `Region.code`, `Workscope.code`, `AppUser.externalId`.

### Likely interview questions (data model)
1. Why is `Fixture.requirementId` optional but `vesselId` required? (Direct fixtures with no prior enquiry are valid; a fixture must always have a vessel.)
2. Explain your `onDelete` choices: why Cascade on subjects but Restrict on the vessel FK?
3. Why is `WeatherSnapshot.fixtureId` nullable?
4. Justify the indexes on `Vessel` and `Fixture`: which queries do they serve?
5. Why store `Recap.mainTerms` as `Json` when the fields are known? (Immutable snapshot of terms at generation time, decoupled from later edits to the live fixture.)

### Honest weak spots (data model / be ready to defend)
- **The only unique constraints are `AppUser.externalId`, `Region.code`, `Workscope.code`, `Vessel.imo`, `Vessel.mmsi`.** There is no constraint that prevents two FIXED fixtures for the same vessel over overlapping dates (see the double-booking weak spot under fixture lifecycle, and the top-level study section).
- **`Broker.email` is not `@unique`; `Charterer.contactEmail` is nullable and not unique.** Email-based actor linking relies on `findFirst`, which silently takes the first match. This is the soft underbelly of the auth model (see two-sided platform).
- **The composite Vessel index is built for the matcher's filter but the matcher does not use it** (the route fetches all vessels then filters in memory). See the matcher weak spots.

---

## 4. Major features in depth

### 4.1 The matcher (FixtureMatcher)

A pure, deterministic two-stage scoring engine that ranks vessels against a requirement. Files: `fixture-matcher.ts:1-176`, `fixture-matcher.types.ts:1-72`, `haversine.ts`, `dp-class.ts`, the route `requirements/[id]/match/route.ts:1-181`, and `MatchRequestSchema` in `requirement.validators.ts:43-52`. Tests: 40 in `fixture-matcher.test.ts` + 9 in `match/route.test.ts` (the reads also count ~51 total in the matcher test file at the higher number).

**Stage 1 — hard filter (binary pass/fail), `passesHardFilters` (`fixture-matcher.ts:19-45`).** A candidate is dropped (not penalized) unless ALL hold: vessel type exact match (23); `status === 'OPEN'` (24); availability `openDate === null` or `openDate <= startDate` (25); `openRegionId === regionId` exact equality, not proximity (26); and conditional capability gates that only apply when the requirement sets a minimum (28-42): `minDeckAreaM2`, `minBollardPullT`, `minDpClass` (via `dpClassMeetsMinimum`). Capability minimums are opt-in: a null requirement value skips that gate.

**Stage 2 — weighted 0-100 score (`fixture-matcher.ts:152-167`).** Three 0-1 factors combined by `DEFAULT_WEIGHTS {distance 0.40, rateFit 0.35, capabilityMargin 0.25}`:
- **Distance** (`scoreDistance`, 51-65): null position → 0 (worst case, not neutral); else haversine nautical-mile distance to the region centroid, normalized as `1 - dist/maxDistance`.
- **Rate fit** (`scoreRateFit`, 67-75): where the requirement's `dayRateBudget` sits in the band `[minRate, maxRate]`, clamped [0,1]. Neutral 0.5 fallback when no budget, no benchmark, or a degenerate band. This is requirement-level, not vessel-level, so it is identical across all passing candidates.
- **Capability margin** (`scoreCapability`, 77-100): headroom above the minimum, averaged across constrained dimensions; deck/bollard `(actual-min)/min` capped at 1.0; DP class via `dpClassHeadroom`; 0.5 neutral when no capability requirements.

Composite = `round((dScore*w.distance + rScore*w.rateFit + cScore*w.capabilityMargin) * 100)`, sorted descending with an alphabetical `vesselName.localeCompare()` tiebreak that makes the result deterministic regardless of input order. **Relative normalization** (`computeMaxDistance`, 106-123) is the subtle choice: distance is normalized against the farthest passing candidate in this run, so a lone candidate scores 100 and scores are not comparable across runs. Haversine (`haversine.ts:14-34`) is a spherical-Earth great-circle formula in nautical miles.

**The route is the imperative shell.** It requires a broker session, validates the cuid param and optional `{ weights }` body (the Zod `.refine()` enforces weights sum to 1.0 ±0.01 in `requirement.validators.ts:48-50`), fetches the requirement + region + all vessels (with latest position) + benchmarks, runs `match()`, and does a **conditional one-way status transition**: if the requirement is `ENQUIRY`, it advances to `SHORTLISTED`; any other status leaves it untouched and echoes the actual current status (`route.ts:156-168`).

#### Likely interview questions (matcher)
1. Walk me through the two stages: why filter first, then score? (Performance; a vessel that fails a hard requirement should never appear regardless of other factors.)
2. Why is distance normalized against the pool max instead of a fixed cap? (Relative ranking vs absolute comparability.)
3. Why does a null position score 0 but a missing benchmark score 0.5? (Unknown location = cannot promise mobilization = penalize; unknown market rate = no information = stay neutral.)
4. How do you guarantee determinism with floating-point scores? (Round to int + alphabetical tiebreak independent of input order.)
5. Why make `match()` pure, and what does the route do that it cannot?
6. Walk me through the haversine formula and why nautical miles.
7. Why does ENQUIRY promote but NEGOTIATING does not? (Match-as-shortlisting-action vs match-as-read; never regress.)
8. The weights must sum to 1.0: where is that enforced? (Zod `.refine` at the boundary, not in the pure function.)
9. How would you scale this to 10,000 vessels?

#### Honest weak spots (matcher / be ready to defend)
- **The matcher does NOT pre-filter in the DB; it fetches ALL vessels.** `route.ts:138-142` does `prisma.vessel.findMany()` with no `where` clause, pulls every vessel into memory, then `passesHardFilters` discards most in JS. The composite index `@@index([status, openRegionId, openDate])` exists for exactly this filter but the query never uses it. This is the single most likely gotcha. Honest answer: "I would push `status='OPEN'`, region, and type into the `where` and let the index work; I kept it in the pure function for testability and because the dataset is demo-sized."
- **Region matching is exact equality, but distance is centroid-based.** Distance only ranks within one region; a physically closer out-of-region vessel is excluded. Do not claim cross-region geographic search.
- **`rateFit` is requirement-level and never changes the ranking.** It is constant across the shortlist, so the 35%-weighted factor only scales absolute scores; it cannot break a tie or flip order. Honest framing: it makes the absolute score meaningful and sets up future per-vessel rate data, but it is arguably mis-weighted for pure ranking.
- **`medianRate` is fetched, typed, and seeded but unused in scoring.** Dead field; `scoreRateFit` only uses min/max.
- **Weights-sum validation lives only at the HTTP boundary.** `match()` itself accepts weights summing to 2.0 and will produce scores >100. The pure function trusts its caller.
- **Tiebreak by vessel name is arbitrary from a business standpoint** (a broker does not care that "Havila" beats "Viking"); it exists purely for determinism.
- **Spherical-Earth haversine, not ellipsoidal/Vincenty** (sub-0.5% error). It is a ranking heuristic, not survey-grade passage-planning distance.
- **Positions and benchmarks are seeded, not live** (see top-level study section). `openDate` is synthetically `now + 7 days` for every OPEN vessel, so the availability filter is essentially uniform in the demo.

### 4.2 The fixture lifecycle (status machine + subject gate + transaction)

Built around a pure policy (`src/lib/services/fixture-status-policy.ts`) that decides legality and an atomic write (`src/app/api/fixtures/[id]/status/route.ts`) that applies it.

**The state machine** is a single data structure, `LEGAL_TRANSITIONS` (`fixture-status-policy.ts:30-36`):
```
DRAFT       -> { NEGOTIATING }
NEGOTIATING -> { ON_SUBS, FAILED }
ON_SUBS     -> { FIXED, FAILED }
FIXED       -> { COMPLETED }
COMPLETED, FAILED -> terminal
```
`evaluateTransition(from, to, context)` (48-112) checks four rules in order: same-status rejection (54), terminal-state rejection (59, checked before the matrix so the error is specific), illegal transition via the matrix (67), and the subject-lift gate (76), which applies only on `ON_SUBS → FIXED`.

**The subject-lift gate** (76-104): empty subjects → reject ("no subjects to lift"); any `PENDING` or `FAILED` subject → reject with the unresolved count; all `LIFTED`/`WAIVED` → allow. `SubjectItemStatus` is `PENDING | LIFTED | WAIVED | FAILED`.

**Side-effects are returned as data, not performed.** On a successful `ON_SUBS → FIXED` the pure function returns `requirementUpdate: { status: 'FIXED' }` (status only, because `Requirement` has no `fixedAt` column while `Fixture` does, asserted in tests) and `fixtureFixedAt: new Date()`. The return type is a discriminated union (`TransitionOutcome`, discriminated on `allowed`), so the route narrows on `result.allowed`.

**The atomic write** (`route.ts:58-85`) guards (broker-only), validates param + body (no `actor` field in the schema, so it cannot be spoofed; actor comes from `guard.ctx.brokerId`), fetches the fixture + subject statuses, evaluates the policy, and on success opens a `prisma.$transaction` that updates the fixture status (+ `fixedAt` conditionally), writes the immutable `FixtureStatusChange` audit row, and propagates `FIXED` to the requirement when `requirementId !== null`.

**Recap** (separate, downstream of FIXED): `POST /api/fixtures/:id/recap` (`recap/route.ts`) is broker-only, refuses unless status is FIXED or COMPLETED (→ 409), builds `mainTerms` via `buildMainTerms`, renders byte-for-byte deterministic Markdown + plain text via `formatRecap` (no timestamps in the body), and versions as `maxVersion + 1`.

#### Likely interview questions (fixture lifecycle)
1. Why is `evaluateTransition` a pure function? What do you gain?
2. Walk me through `ON_SUBS → FIXED` end to end.
3. Why a `$transaction` instead of three sequential writes? (Atomicity of the three writes.)
4. How do you stop a user from spoofing who made the change? (Actor not in the schema; from session.)
5. Why is the subject gate only on `ON_SUBS → FIXED` and not on `ON_SUBS → FAILED`?
6. Why does an empty subject list block FIXED?
7. Why does the requirement get only `status` and not `fixedAt`?
8. Why is the recap generator pure and deterministic, and why gated to FIXED/COMPLETED?
9. What order do your guards run in, and why?

#### Honest weak spots (fixture lifecycle / be ready to defend)
- **There is NO double-booking / overlap constraint, and the transaction does NOT solve this.** The `$transaction` guarantees atomicity of the three writes for a single transition; it does not and cannot prevent two brokers from fixing the same vessel over overlapping dates. There is no `@@unique`, no Postgres `EXCLUDE` constraint, and no app-level overlap check anywhere in the fixture routes. If you claim the transaction prevents double-booking, that is wrong and a sharp interviewer will catch it. Be ready to design it: a Postgres `EXCLUDE` over `tstzrange` of (vesselId, date-range) with `&&`, or an app-level check inside the transaction with `SELECT ... FOR UPDATE` on the vessel row.
- **Lost-update race on the transition itself.** The fixture is read outside the transaction (`findUnique`), then the policy runs, then the write happens inside; there is no optimistic-lock check (no version column, no `where: { status: fromStatus }` compare-and-swap). Two concurrent PATCHes that both read `ON_SUBS` can both pass. Read Committed will not catch it. Fix: `where: { id, status: fromStatus }` on the update, or SERIALIZABLE isolation.
- **Subject statuses are also read outside the transaction** (same TOCTOU window).
- **`new Date()` makes the policy technically impure.** The code comment owns this; a clock could be injected for full determinism.
- **`recap/route.ts:64` uses `(mainTerms as unknown) as Prisma.InputJsonValue`** — a double `as` cast, violating the codebase's "no `as`" rule. Pragmatic seam for storing a typed object as Prisma JSON; ideally a Zod `satisfies` round-trip.
- **`recap.helpers.ts:35` hardcodes `laycanTo: null`** and maps `laycanFrom` from `commencement`, so the recap laycan window is always partial.
- **Subjects are not auto-created**; they are added manually via `POST .../subjects`, so the gate only has teeth if someone entered subjects.
- **The matrix has no reopen/backward path.** Once FAILED or COMPLETED, the fixture is frozen; no correction workflow, only a DB edit.
- **Recap emits only SUPPLYTIME 2017**; anything else degrades to "Other". It is a template renderer, not a contract engine.

### 4.3 Weather (marine workability)

A three-layer slice: a pure verdict function, a fetch+cache enricher, and two routes. This is the one genuinely live external integration.

**Pure verdict** (`weather-verdict.ts`): `computeVerdict(readings, thresholds?)` (32-57) returns `'WORKABLE' | 'MARGINAL' | 'NOT_WORKABLE'` from `NORTH_SEA_THRESHOLDS` (11-20): WORKABLE if wave < 2.0 m and swell < 2.5 m; MARGINAL up to wave < 3.0 m / swell < 4.0 m; else NOT_WORKABLE. Comparisons are strict `<` (a wave at exactly 2.0 m is MARGINAL). Wind-wave height is carried but never used in the verdict. Null swell passes the swell gate.

**Enricher** (`weather-enricher.ts`): `fetchMarineWeather(lat, lng, config?)` (16-91) does cache → fetch → validate → verdict. The cache is a module-level `Map` (8) keyed by `${lat.toFixed(2)},${lng.toFixed(2)}` (~1 km quantization), default TTL 5 min (10). It uses an `AbortController` 10 s timeout with `clearTimeout` in `finally` (38-52), calls Open-Meteo Marine with `cell_selection=sea` (43-47), checks `response.ok` before `response.json()` (54-58, so an HTML error page is never parsed as JSON), Zod-validates via `OpenMeteoResponseSchema.safeParse` (58-62), and handles nulls (`wave_height ?? 0.0`; swell/wind-wave pass through as null). `clearWeatherCache()` exists for test isolation.

**Validators** (`weather.validators.ts`): the standout is `requiredCoordParam` (12-13): `z.string().trim().min(1).pipe(z.coerce.number().finite().min(min).max(max))`. A bare `z.coerce.number()` would coerce a missing or empty `lat` to `0` (a valid coordinate in the Gulf of Guinea), so requiring a non-empty string before coercion plus `.finite()` rejects missing/empty/`abc`/`NaN`/`Infinity`. This is the strongest single talking point in the subsystem.

**Routes:** `GET /api/weather/marine` (session gate → validate query → enrich → ad-hoc snapshot with `fixtureId: null`; any enricher throw → 502). `POST /api/fixtures/[id]/weather` (session gate → validate cuid param → defensive `request.json()` in try/catch → validate body → fixture lookup 404 → enrich 502 → derive laycan window → `weatherSnapshot.create` → 201). `workabilityVerdict` is stored as a plain `String`, not a DB enum.

#### Likely interview questions (weather)
1. Why coerce-then-validate with a required string instead of `z.coerce.number()`? (The `lat=0` silent-default bug.)
2. Walk me through what happens when Open-Meteo is down, slow, or returns garbage. (Three failure modes, all funnel to 502.)
3. Why check `response.ok` before `response.json()`?
4. Your cache is an in-process `Map`. What happens with serverless / multiple instances?
5. Why is the verdict a separate pure function with injectable thresholds?
6. Why strict `<` at the boundaries?
7. GET does not persist but POST does: why two endpoints?

#### Honest weak spots (weather / be ready to defend)
- **The cache is per-process and unbounded.** On Vercel serverless every cold lambda has its own empty `Map`, so the 5-min TTL is best-effort, not global; there is no eviction, so the Map grows one entry per unique rounded coordinate for the process lifetime (a slow leak). Honest answer: "fine for a single-instance demo; production would use Redis or an edge cache with a bounded LRU."
- **Thresholds are assumed, not sourced.** The comment says "industry standard for North Sea" with no citation, and they are applied to every fixture regardless of its actual region. Real workability depends on vessel class, DP capability, crane SWL, heading vs sea, and peak wave period, not just significant wave height. Honest framing: "plausible placeholder thresholds; the function takes injectable thresholds so swapping in the operator's op-limit matrix is a config change."
- **Wind-wave is fetched, stored, and displayed but never influences the verdict.** Call it out before they find it.
- **`wave_height: null → 0 → WORKABLE`** is a quiet failure mode: a sensor/grid gap reads as perfect conditions rather than unknown. Arguably should be a separate `UNKNOWN` state.
- **The 4 weather snapshots a charterer sees are seeded** (`prisma/seed.ts:422-604`) with pre-computed verdicts. The live Open-Meteo path is real and tested, but do not claim the dashboard shows live conditions.
- **`POST /api/fixtures/:id/weather` uses `requireApiSession` (any authenticated user), not `requireBrokerApi`** (`weather/route.ts:13`), and the fixture lookup is `findUnique` by id only with no tenant scoping. A charterer could persist a weather snapshot onto any fixture by ID. This is a real authorization gap; flag it honestly as "weather is treated as low-risk, but it is a write that is not broker-gated or tenant-scoped."
- **No retry/backoff** on a transient blip; one failure is a hard 502.

### 4.4 The two-sided platform + auth/roles

The whole app authenticates against an external self-hosted OIDC provider ("ManuMuStudio" IdP), configured by hand as a generic `oauth` provider (`auth.ts:8-37`). PKCE + state are enforced (26); the `issuer` is built with a trailing slash to match the signed `iss` claim (17); the OIDC profile is Zod-validated at the boundary via `OidcProfileSchema.parse` (28), and again in the `jwt` callback. Sessions are **JWT-strategy, 30-day** (38-41); there is no DB session table.

**Provisioning (OIDC identity → business actor).** The `AppUser` table maps the stable OIDC `sub` (`externalId`) to a `Broker` (role BROKER) or `Charterer` (role CLIENT). `findOrCreateAppUser` (`app-user-provisioning.ts:27-44`) upserts on first contact and is concurrency-safe: a P2002 unique-race on `externalId` is caught and recovered by re-reading the winner's row (detected via `error.code`/`error.meta.target` through `Reflect.get`, no `as`). `resolveActor` (`provision-actor.ts:26-56`) links a broker by matching `Broker.email`; in prod, no match → 403 "not configured"; in dev/demo → auto-create a broker. `resolveChartererContext` (`require-charterer.ts:66-105`) mirrors this and in dev only auto-links the seeded "Equinor ASA" charterer.

**Role resolution and routing.** Two resolvers exist: `resolveRole` (`resolve-role.ts:34-38`, pure, no I/O, returns `{ role, homeRoute }`) and `resolveHomeRoute` (`resolve-home-route.ts:10-26`, the actually-used async DB version). Routing is enforced at three layers: the post-login hop (`GET /api/auth/post-login` reads the session, calls `resolveHomeRoute`, 302s to `/portal` or `/dashboard`), the route-group layouts, and the per-route guards.

**Data scoping (the two-sided split).** Charterer queries (`portal-queries.ts`) all take a session-derived `chartererId` and filter on it; detail reads use `findFirst({ where: { id, chartererId } })` so a foreign id → `null` → 404 (63-75); creates hard-set `chartererId` from the session (94). The broker dashboard (`broker-queries.ts`) is deliberately NOT charterer-scoped: brokers see the whole incoming queue across every charterer. Mutation hardening: every write route resolves the actor from the session and writes `brokerId: actor.brokerId`, never the body. A repo-wide grep confirms no API route trusts a body-supplied `brokerId`.

**Federated sign-out** (`/api/auth/federated-signout`) decodes the session cookie to recover the OIDC `id_token`, redirects to the IdP `/oauth/logout` with `id_token_hint`, then expires every Auth.js cookie (plain and `__Secure-`).

**Env guard:** `env.server.schema.ts` Zod-parses server env and refuses to boot in prod on dev-placeholder secrets, except in CI. An E2E auth bypass (`auth.ts:73-83`) returns a synthetic session, fenced to non-production + `E2E_TEST_USER` flag.

#### Likely interview questions (auth / two-sided)
1. Walk me from clicking Sign in to landing on the right dashboard.
2. What is PKCE and why do you need `state`? Why the trailing slash on the issuer?
3. How does an OIDC `sub` become a broker with data? What is `AppUser`, and why not store role in the JWT?
4. First login can race across the callback and two guards. How do you avoid duplicate `AppUser` rows? (P2002 catch + re-read.)
5. How do you stop a broker creating a fixture as a different broker? (Actor from `resolveActor`, never the body.)
6. Where exactly is tenant isolation enforced, and what stops a charterer reading another charterer's enquiry? (`where: { chartererId }`, `findFirst({ id, chartererId })` → 404.)
7. JWT vs database sessions: why JWT, and what are the revocation trade-offs?
8. How do you log out of both your app and the shared IdP?

#### Honest weak spots (auth / two-sided / be ready to defend)
- **`resolveRole` is fully written and tested but unused in production** (only the DB `resolveHomeRoute` is consumed). Two parallel role resolvers, one orphaned. Be ready to say why both exist (pure-vs-I/O) or admit it is redundant.
- **Stale top-of-file comments** in `actions.ts:7-8` and `provision-actor.ts:1-4` say brokers land on `/requirements`, but the actual broker home migrated to `/dashboard`. An interviewer reading comments will catch the drift.
- **Email-based linking is the trust anchor and it is soft.** Linking is `Broker.email === user.email` / `Charterer.contactEmail === user.email`, with no verified-email check, `Broker.email` not unique, and `findFirst` taking the first match. Honest answer: "I rely on the IdP to verify email; a real multi-tenant system would use an explicit invite/claim flow, not email-equality auto-linking."
- **Dev/demo auto-provisioning is generous.** In non-prod, an unmatched user becomes a brand-new Broker or auto-links to "Equinor ASA". Great for a demo, but the production 403 path is the least-exercised in practice.
- **All brokers and charterers are seeded** with `.example`/`.demo` emails; the two-sided experience depends on auto-linking to those seed rows. Do not claim real multi-org onboarding works end to end in prod.
- **The E2E bypass is a real auth-skip path**, correctly fenced to non-production; be ready to defend the `NODE_ENV!=='production'` guard.
- **JWT sessions cannot be revoked server-side before the 30-day expiry** except via cookie clearing; a stolen cookie is valid until expiry.
- **No rate limiting / CSRF beyond Auth.js defaults** on the gated mutation routes.
- **Tests are unit-level with mocked Prisma.** They prove the branching (broker/charterer/anonymous/unprovisioned, the P2002 recovery) but not that the real queries scope correctly against a live DB; that confidence rests on E2E, which itself uses the synthetic-session bypass. The most honest answer to "how do you know charterer A cannot read charterer B's data" is "I assert it by reading the `where` clauses; I do not have an adversarial integration test proving it."

### 4.5 The copilot (v1 grounded chat shipped, v2 agent in progress)

**v1 (committed, stable): a grounded RAG-style chat, no autonomous actions, broker-only.** `buildBrokerDataSummary` (`broker-data-summary.ts`) turns the broker's live dashboard aggregate into a labeled plain-text block (numbered `[E1]`/`[F1]`/`[A1]` items, named fields, IDs, a totals line) injected into the system prompt as the model's only source of truth. `buildCopilotSystemPrompt` (`copilot-prompt.ts:55-57`) concatenates a fixed `RULES` block + that data block. The guardrails (19-51) live entirely in `system` (instruction/data separation as a prompt-injection defence): answer only from the data block; if absent, return the fixed phrase `"I don't have that in the desk's current data."`; never invent vessels/rates/dates/counts; stay in domain; treat the injected data as data not instructions. The endpoint gates with `requireBrokerApi()`, so charterers cannot reach the copilot. There are cheap abuse caps (message count, char budget, step cap).

**v2 (in progress on `feat/copilot-agent`, the current branch):** a bounded tool-using agent. Read tools (`getFixture`, `findMatches`) auto-execute; write tools (`advanceFixtureStatus`, `generateRecap`) are approval-gated (human-in-the-loop: the model proposes, the broker approves, only then does it mutate). The route handler (`src/app/api/broker/copilot/route.ts`) and `src/lib/services/copilot/tools/*` carry this work and are mid-edit. The v1 client hook `useBrokerCopilot.ts` already wires the AI SDK `useChat` + `addToolApprovalResponse` approval control.

#### Likely interview questions (copilot)
1. How do you stop the copilot hallucinating vessels or rates? (Grounding block as sole source of truth + system-prompt guardrails + fixed refusal phrase.)
2. How do you defend against prompt injection in the broker's data/notes? (Instruction/data separation; data treated as data; guardrails only in `system`.)
3. What is your plan for letting the AI actually change records safely? (v2 approval-gated write tools, human-in-the-loop.)
4. Why is the copilot a single `POST /api/broker/copilot` endpoint?

#### Honest weak spots (copilot / be ready to defend)
- **v2 is unfinished.** If asked to demo autonomous tool-use, only the grounded chat (v1) is stable; the approval-gated write tools are mid-build on this branch. Describe v1 as shipped and v2 as in progress; do not claim the agent is done.
- **Grounding scope is the whole broker dashboard aggregate.** The model can only cite what is in that summary block; anything outside it returns the fixed refusal. That is the intended bound, but it means the copilot's "knowledge" is exactly the data summary's coverage, not the full DB.
- **A clean checkout of `main` has fewer tests than this branch** (the v2 copilot tests are uncommitted). Be precise about which branch you are demoing.

### 4.6 The API surface

29 `route.ts` files total (verified). The README markets "21 broker/domain endpoints + /health + portal + broker dashboard + Auth.js" (`README.md:67`). Breakdown: 3 auth + 1 health + 5 portal + 2 broker (dashboard + copilot) + 18 broker/domain.

- **Auth & health:** `/api/auth/[...nextauth]` (re-exports Auth.js GET/POST, so a grep for `export async function` finds nothing there), `GET /api/auth/federated-signout`, `GET /api/auth/post-login`, `GET /api/health`.
- **Charterers:** `GET,POST /api/charterers`; `GET /api/charterers/[id]`; `GET /api/charterers/[id]/requirements`; `GET /api/charterers/[id]/fixtures`.
- **Requirements:** `POST,GET /api/requirements`; `GET /api/requirements/[id]`; `POST /api/requirements/[id]/match`.
- **Fixtures:** `GET,POST /api/fixtures`; `GET /api/fixtures/[id]`; `PATCH /api/fixtures/[id]/status`; `POST /api/fixtures/[id]/subjects`; `PATCH /api/fixtures/[id]/subjects/[subjectId]`; `POST /api/fixtures/[id]/recap`; `POST /api/fixtures/[id]/weather`.
- **Vessels:** `GET /api/vessels`; `GET /api/vessels/[id]`; `GET /api/vessels/positions`.
- **Weather:** `GET /api/weather/marine`.
- **Portal:** `GET /api/portal/dashboard`; `GET,POST /api/portal/enquiries`; `GET /api/portal/enquiries/[id]`; `GET /api/portal/fixtures`; `GET /api/portal/documents`.
- **Broker:** `GET /api/broker/dashboard`; `POST /api/broker/copilot`.

**Cross-cutting design:** uniform session gate (`requireApiSession` discriminated union forces the early-return 401); actor-from-session never from body; consistent validation order (route-param cuid → defensive JSON parse → Zod body → DB); consistent envelope (`{ data }` / `{ error }`) with disciplined status codes (400/401/404/502/201/200); no runtime LLM in the source of truth (matcher, recap, status policy, weather verdict are all deterministic pure TS).

#### Likely interview questions (API surface)
1. How do you guarantee every protected route is actually protected? (Typed `requireApiSession` union + uniform first-line pattern; note there is no central enforcement.)
2. Why route handlers over a separate API server / tRPC / GraphQL?
3. How do you prevent actor impersonation?
4. Walk me through one full request lifecycle.
5. Why is the copilot just `POST /api/broker/copilot`?

#### Honest weak spots (API surface / be ready to defend)
- **The session gate is convention, not enforcement** (repeated from architecture): a forgotten preamble ships an open endpoint. Fix: a `withAuth(handler)` wrapper.
- **The "21 endpoints" number is fuzzy** (files vs method-pairs vs marketing count). Answer in terms of resource routes (29 `route.ts` files, several with 2 methods) rather than parroting 21.
- **`/api/auth/[...nextauth]` shows no exported function** because it re-exports Auth.js handlers; know why your own grep would not find GET/POST there.
- **The copilot route is mid-edit** (`M` on `feat/copilot-agent`); describe it as v1 chat with v2 in progress.

### 4.7 Testing / CI

- **Runners:** Vitest 3 (unit/integration) + Playwright (E2E).
- **Counts:** full run = 369 tests / 59 files, all passing in ~5.8 s. The stable committed surface = 344 tests / 52 files. The README claims "343 across 52" (`README.md:114`, off by one). The extra 17 tests in 7 files are the untracked copilot v2 work.
- **Shape:** heavy on pure-service tests (matcher ~51, status-policy 33, dp-class 20, weather-verdict 16, weather-enricher 14) plus per-route handler tests that mock `prisma` and services. Weather enricher tests mock `global.fetch` entirely; no live Open-Meteo call.
- **Vitest config:** `environment: 'node'`, `globals: true`. `@/features/auth/auth` is aliased to a test double (next-auth imports `next/server`, unloadable under Vitest); `server-only` is stubbed. Coverage gate (v8): statements 70 / branches 60 / functions 70 / lines 70, scoped to `src/lib/**`, `src/app/api/**`, `src/features/**`, excluding types/tests/barrels/mocks/`prisma.ts`.
- **Playwright:** chromium only; `globalSetup` seeds; CI `retries: 2`, `workers: 1` (serial, shared seeded DB); the web server runs `dev:e2e` with `E2E_TEST_USER: 'true'` (inert in prod). 4 specs: smoke, happy-path, map, landing.
- **CI** (`.github/workflows/ci.yml`): PR + push to main; concurrency cancels in-progress runs for the same ref. Four jobs: `lint-typecheck` (`npm audit --audit-level=high` both with and without `--omit=dev`, prisma generate, tsc, lint), `test-coverage` (Codecov, `fail_ci_if_error: false`), `build-bundle` (`next build`, fails if shared JS > 200 kB, then a smoke test that curls `/api/health` accepting 200 or 503), and `e2e` (`needs` the other three; real `postgres:16-alpine`, migrate + seed, playwright).

#### Likely interview questions (testing / CI)
1. How many tests, and what do they actually cover? (344 committed; mostly pure-service + mocked handlers; few true integration tests; E2E covers real wiring.)
2. Why mock `fetch` and `prisma` instead of integration tests?
3. Why the next-auth and server-only aliases in Vitest?
4. Why is the smoke test happy with a 503?
5. Why `workers: 1` in Playwright?
6. Walk me through the CI DAG and where it fails fast.
7. How is the auth bypass safe?

#### Honest weak spots (testing / CI / be ready to defend)
- **README test count is stale** (343 vs actual 344/369). Minor, but an interviewer who runs `npm test` sees a different number.
- **Coverage thresholds are modest (70/60/70/70) and scoped.** UI components and most pages are excluded from the coverage `include`, so the headline number does not reflect the frontend. Do not claim "70% coverage of the app"; it is 70% of the services + API + features slice.
- **Branches at 60% is the weakest gate**; route error branches are less covered than the verdict/matcher branches.
- **Almost no real-integration tests.** Route tests mock Prisma entirely, so they verify handler logic, not actual SQL/schema behaviour; only the 4 Playwright specs hit a real Postgres.
- **The smoke test accepting 503** means a deploy with a broken DB still passes smoke. Defensible (it tests that the web server boots), but say so explicitly.
- **`fail_ci_if_error: false` on Codecov** means coverage reporting failures will not block, but threshold enforcement lives in Vitest's `test:coverage` step, so the gate is real. Distinguish "upload is best-effort" from "threshold is enforced."
- **E2E `retries: 2` can mask flakiness**; no flaky-test tracking is visible.

---

## 5. WEAK SPOTS — STUDY THESE FIRST

Prioritised list of where you are most likely to be caught or pressed, each with the honest answer to give.

1. **Seeded vs live data (lead with this, do not get cornered into overclaiming).** Almost everything is synthetic seed data (`prisma/seed.ts`, ~675 lines, idempotent): 30 vessels, 8 owners, 6 charterers, 4 brokers, 7 regions, 9 workscopes, 6 benchmarks, 4 requirements, 5 fixtures, plus subjects, weather snapshots, 2 recaps. Emails are `.example`/`.demo`; vessel images are house-art or CC-licensed photos of real same-named ships with credits stating the photo is not the demo record; positions are `source: SEEDED, confidence: MEDIUM` (no live AIS); benchmarks are hardcoded; `openDate` is uniformly `now + 7 days`. **Honest answer:** "The only genuinely live external integration is Open-Meteo Marine weather. Everything else is seeded demo data. The real, defensible engineering is the pure deterministic services, the auth/actor model and tenant scoping, the Zod boundaries, and the cascade/index design."

2. **The missing double-booking constraint (and do not credit the transaction with it).** There is no uniqueness, no Postgres `EXCLUDE`, and no app-level overlap check preventing two FIXED fixtures for the same vessel over overlapping dates. The `$transaction` only guarantees atomicity of the three writes in a single transition. **Honest answer:** "The transaction makes a status change all-or-nothing; it does not prevent double-booking. I would add a Postgres `EXCLUDE` constraint over a `tstzrange` of (vesselId, dates) with `&&`, or an app-level check inside the transaction with `SELECT ... FOR UPDATE` on the vessel row." Also name the related lost-update race: the read-then-write is not optimistically locked.

3. **The matcher fetches ALL vessels into memory instead of using the index.** `findMany()` with no `where`, then filters in JS, despite a composite index built for exactly that filter. **Honest answer:** "I would push `status='OPEN'`, region, and type into the `where` clause and let the index work. I kept the filter in the pure function for testability and because the dataset is demo-sized."

4. **Copilot grounding scope and v2 status.** v1 grounded chat is shipped and broker-only; the model's only source of truth is the broker dashboard summary block, with a fixed refusal phrase for anything outside it. v2 approval-gated tool-use is mid-build on `feat/copilot-agent`. **Honest answer:** "v1 is a grounded chat that cannot hallucinate or act; it can only cite the data summary. The autonomous, approval-gated agent is in progress, not shipped."

5. **The in-memory weather cache.** A per-process `Map` with a 5-min TTL and no eviction; on serverless every cold lambda starts empty and it never shares across instances. **Honest answer:** "It is best-effort for a single-instance demo. Production would use Redis or an edge cache with a bounded LRU."

6. **Single-broker / soft email-linking assumption in auth.** Actor linking is email-equality with no verified-email check and `Broker.email` not unique; dev/demo auto-provisions brokers and auto-links "Equinor ASA"; the prod 403 path is the least-exercised. **Honest answer:** "I rely on the IdP to verify email; a real multi-org system would use an explicit invite/claim flow. The auto-provisioning is a demo affordance, gated to non-production."

7. **The weather POST is not broker-gated or tenant-scoped.** `requireApiSession` (any authenticated user) + `findUnique` by id only means a charterer could write a weather snapshot onto any fixture. **Honest answer:** "Weather was treated as low-risk, but it is a write; it should be `requireBrokerApi` with a tenant-scoped lookup. Known gap."

8. **The session gate is convention, not enforcement.** No fail-closed wrapper; a forgotten preamble ships an open route. **Honest answer:** "I would wrap handlers in `withAuth` or a fail-closed matcher. Per-route auth tests are the current net."

9. **Tenant isolation is asserted by reading `where` clauses, not proven adversarially.** Unit tests mock Prisma; E2E uses the synthetic-session bypass. **Honest answer:** "I do not have an adversarial integration test proving charterer A cannot read charterer B's data; that is the next test I would write."

10. **Surviving `as` casts and stale docs.** `recap/route.ts:64` has a double `as` cast (violating the no-`as` rule); the README test count is stale (343 vs 344/369); `resolveRole` is dead code; comments in `actions.ts`/`provision-actor.ts` still say `/requirements` when the broker home is `/dashboard`. **Honest answer:** own each as a known cleanup item rather than being surprised by it.

---

## 6. How to use this

Paste this entire file into a new claude.ai chat, then prompt it with something like:

> "You are a senior engineering interviewer for a shipbroking-tech role. Using the report above, quiz me hard on FixtureLog. Start with the 'WEAK SPOTS — STUDY THESE FIRST' section, one item at a time. Ask the question, wait for my spoken/typed answer, then tell me where I was vague, wrong, or overclaimed, and give me the honest answer I should have given. Push on follow-ups until I can defend each weak spot cleanly. Do not let me credit the transaction with preventing double-booking, and do not let me claim any seeded data is live."

Then work down the per-feature "Likely interview questions" lists once the weak spots feel solid.
