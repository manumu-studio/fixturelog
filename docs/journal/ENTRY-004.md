# Entry 4

**Date:** 2026-06-12
**Type:** Feature
**Branch:** `feat/weather-e2e`
**Version:** `0.5.0`
**Packet:** `PACKET-004 — Weather Enrichment + Happy-Path E2E`
**PR:** `PR-0.5.0`

## Summary

Built the marine weather evidence layer and the first full-workflow broker E2E. Starting from the PACKET-003 foundation (20 API routes including matching, `FixtureMatcher`, pure service layer), this packet added a Zod validator module for weather boundaries, enricher types, a pure `computeVerdict()` function, a `WeatherEnricher` service (Open-Meteo fetch + in-memory TTL cache), two new API routes (marine weather proxy + fixture-linked snapshot persistence), an additive `weatherSnapshots` include on the fixture-detail route, 2 seeded snapshots, and a hermetic happy-path E2E covering the full broker workflow from requirement creation through recap generation.

## Key Decisions

- **`current` conditions, not `hourly[0]`** — Open-Meteo's `hourly` array index 0 is midnight of the current day, not the present moment. The marine proxy uses `current=wave_height,swell_wave_height,wind_wave_height&cell_selection=sea` so the values reflect what is happening now. This distinction is subtle but wrong data at `hourly[0]` would make the workability verdict meaningless.

- **Three-layer weather architecture** — `computeVerdict()` is a pure function (thresholds → verdict, no I/O); `WeatherEnricher` is the I/O + cache layer (fetch + TTL, no DB writes); the route handler is the only persistence layer. This is the same separation-of-concerns pattern used by `FixtureMatcher` (pure service, I/O in the route handler). Each layer is independently testable.

- **Route persistence, not service persistence** — putting the `WeatherSnapshot` DB write in the route handler, not the enricher, keeps the service portable (callable from tests, other routes, or a future background job) without dragging in a DB dependency.

- **`fixtureId: null` for ad-hoc lookups** — the proxy route (`GET /api/weather/marine`) always returns `fixtureId: null` in the response shape, even though it does not write to the DB. This gives a consistent `WeatherSnapshot`-shaped response regardless of call site and avoids callers needing to check for the field's absence.

- **Hermetic E2E via seeded snapshots** — verifying weather in the E2E by hitting live Open-Meteo would introduce flakiness and network dependency. Instead, `prisma/seed.ts` seeds 2 `WeatherSnapshot` rows on fixture2 and fixture3. The E2E reads the fixture-detail endpoint and asserts `weatherSnapshots.length >= 1`. Zero live API calls in the automated suite; the manual curl path in the task file covers the live-network scenario as a spot-check.

- **Subject-lift gate honored in the E2E** — rather than seeding an already-FIXED fixture, the happy-path spec creates a fresh fixture, advances it to `ON_SUBS`, creates a `SubjectItem`, sets it to `LIFTED`, and only then attempts `ON_SUBS → FIXED`. This proves the gate works end-to-end, not just in unit tests, and follows the real broker workflow.

- **Rate limiting as a roadmap concern, not an in-code TODO** — Open-Meteo has undocumented rate limits. Adding a comment `// TODO: rate limit` in the route would trip artifact scanners and creates noise without action. The concern is tracked in `docs/roadmap/ROADMAP.md` under PACKET-004's future concerns, where it can be addressed in a focused follow-up.

- **`response.ok` guard before Zod parse** — the enricher checks `response.ok` first. Without this, a rate-limit or server-error body from Open-Meteo would reach `z.schema.parse()` and produce a confusing Zod validation error instead of a clear "upstream API error" message.

- **`z.coerce.number()` in the query schema** — URL query-string values are always strings. Using `z.coerce.number()` handles the string-to-number coercion automatically at the parse boundary without requiring a manual `Number()` call in the route handler and keeps the schema self-describing.

## Algorithm / Verdict Thresholds

`computeVerdict()` applies North Sea operating thresholds:

| Metric | WORKABLE | MARGINAL | NOT_WORKABLE |
|--------|---------|---------|-------------|
| Wave height (m) | < 2.0 | < 3.0 (above WORKABLE) | ≥ 3.0 |
| Swell height (m) | < 2.5 (or null) | < 4.0 (above WORKABLE) | ≥ 4.0 |
| Wind-wave height (m) | recorded, does not influence verdict | — | — |

Wave and swell drive the verdict using strict `<` boundaries (e.g. wave 1.99 → WORKABLE, 2.0 → MARGINAL). Wind-wave height is recorded in the snapshot but does not affect the workability assessment. The verdict is NOT the worst of three metrics — only wave height and swell height determine the outcome.

## Files Created

**Validators**

- `src/lib/validators/weather.validators.ts` — Zod schemas: query params (`lat`, `lng` as coerced numbers), external Open-Meteo response shape, and `WeatherSnapshot`-shaped output

**Service types**

- `src/lib/services/weather-enricher.types.ts` — TypeScript interfaces for enricher input/output and the TTL cache entry

**Services**

- `src/lib/services/weather-verdict.ts` — `computeVerdict()` pure function + North Sea threshold constants
- `src/lib/services/weather-verdict.test.ts` — 16 tests
- `src/lib/services/weather-enricher.ts` — `WeatherEnricher` class wrapping Open-Meteo fetch + 5-min TTL cache
- `src/lib/services/weather-enricher.test.ts` — 14 tests

**Route Handlers**

- `src/app/api/weather/marine/route.ts` — `GET /api/weather/marine?lat=&lng=` proxy
- `src/app/api/weather/marine/route.test.ts` — 6 tests
- `src/app/api/fixtures/[id]/weather/route.ts` — `POST /api/fixtures/:id/weather` snapshot persistence
- `src/app/api/fixtures/[id]/weather/route.test.ts` — part of fixture weather route tests

**E2E**

- `e2e/happy-path.spec.ts` — hermetic full-workflow broker E2E (1 spec)

## Files Modified

- `src/app/api/fixtures/[id]/route.ts` — GET handler now includes `weatherSnapshots` in the Prisma `include`
- `prisma/seed.ts` — 2 seeded `WeatherSnapshot` rows linked to fixture2 and fixture3

## Validation

| Gate | Result |
|------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 239 tests across 26 files |
| Coverage: statements / branches / functions / lines | ✅ 94.92% / 85.03% / 93.61% / 94.92% (thresholds 70/60/70/70) |
| `npm run build` — First Load JS shared | ✅ 102 kB (budget < 200 kB) |
| `npm run test:e2e` | ✅ 3 specs pass (2 smoke + 1 happy-path) |
| No Prisma migration | ✅ `WeatherSnapshot` existed in PACKET-002 schema |

## Next Step

Begin `PACKET-005 — Weather UI / Visual Demo Polish`: surface the weather verdict and snapshot data in the browser, add visual weather indicators to the fixture detail page or a dedicated weather panel, and prepare the demo for deployment to Vercel + Neon.
