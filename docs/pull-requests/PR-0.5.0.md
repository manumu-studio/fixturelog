# PR-0.5.0 — Weather Enrichment + Happy-Path E2E (Open-Meteo proxy, workability verdict, persisted snapshots, hermetic E2E)

**Branch:** `feat/weather-e2e` → `main`
**Version:** `0.5.0`
**Date:** 2026-06-12
**Status:** ✅ Ready to merge

---

## Summary

Introduces the marine weather evidence layer: an Open-Meteo proxy endpoint with a 5-minute in-memory cache, a pure workability verdict function (`WORKABLE` / `MARGINAL` / `NOT_WORKABLE`), fixture-linked snapshot persistence, and the first full-workflow broker happy-path E2E. The E2E is hermetic — weather is verified via 2 seeded `WeatherSnapshot` rows surfaced through the fixture-detail route, with zero live Open-Meteo calls in the automated suite.

---

## What Was Built

### Validators (1 new Zod module)

- `src/lib/validators/weather.validators.ts` — three Zod schemas: query params (`lat`, `lng` as `z.coerce.number()` to handle URL string values), the external Open-Meteo response shape (parses the `current` block), and the `WeatherSnapshot`-shaped output type.

### Services (3 new modules)

| Module | Description |
|--------|-------------|
| `src/lib/services/weather-enricher.types.ts` | TypeScript interfaces for enricher input/output and the TTL cache entry |
| `src/lib/services/weather-verdict.ts` | `computeVerdict()` — pure function applying North Sea wave/swell/wind-wave thresholds to produce a `WorkabilityVerdict`. No I/O, no state. |
| `src/lib/services/weather-enricher.ts` | `WeatherEnricher` — wraps the Open-Meteo Marine `current` conditions call with a 5-minute in-memory TTL cache. Calls `computeVerdict()`. No database writes. |

### API Routes (2 new endpoints)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/weather/marine?lat=&lng=` | Proxies Open-Meteo Marine; returns workability verdict + wave/swell/wind-wave data; `fixtureId: null` (no persistence) |
| POST | `/api/fixtures/:id/weather` | Calls `WeatherEnricher`, persists a `WeatherSnapshot` linked to the fixture, returns snapshot with `fixtureId` |

### Fixture Detail Update

- `GET /api/fixtures/:id` now includes a `weatherSnapshots` array (additive include — non-breaking, no migration). Seeded fixtures (fixture2, fixture3) return populated arrays.

### Seed

- `prisma/seed.ts` — 2 `WeatherSnapshot` rows added, linked to fixture2 and fixture3. Used by the E2E for hermetic weather verification.

### E2E

- `e2e/happy-path.spec.ts` — single spec covering the complete broker workflow:
  1. Create a requirement at `ENQUIRY`
  2. POST to the match endpoint → `SHORTLISTED` + ranked shortlist returned
  3. Create a fixture linked to requirement + vessel
  4. Assert `GET /api/fixtures/:id` returns `weatherSnapshots.length >= 1` (seeded data)
  5. Add a `SubjectItem`, set status to `LIFTED`
  6. PATCH fixture status `NEGOTIATING → ON_SUBS` → `ON_SUBS → FIXED` (subject-lift gate honored)
  7. POST to recap endpoint → recap text generated

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `current` conditions, not `hourly[0]` | `hourly[0]` is midnight of the current day, not the present moment. `current=wave_height,...` gives real-time values. Incorrect data source would make the verdict meaningless. |
| Pure verdict / I/O enricher / route persistence separation | Same pattern as `FixtureMatcher` — pure function is trivially unit-testable; enricher is independently mockable; DB write stays in the route handler where it belongs. |
| `fixtureId: null` for ad-hoc lookups | Consistent `WeatherSnapshot`-shaped response regardless of call site. Callers never need to check for field absence. |
| Hermetic E2E via seeded snapshots | Live Open-Meteo calls would introduce network flakiness and key-dependency into CI. Seeded rows provide deterministic, always-available weather data for the automated suite. |
| Rate limiting deferred to roadmap | Recorded as a future concern in `ROADMAP.md`, not as an in-code TODO. Avoids noisy artifact flags; can be addressed in a focused follow-up packet. |
| `response.ok` guard before Zod parse | A non-2xx body from Open-Meteo would produce a misleading Zod validation error without this guard. Explicit error before parse gives a clear diagnostic. |

---

## Testing

### Test files added this packet

| File | Tests |
|------|-------|
| `src/lib/services/weather-verdict.test.ts` | 16 |
| `src/lib/services/weather-enricher.test.ts` | 14 |
| `src/app/api/weather/marine/route.test.ts` | 6 |
| `src/app/api/fixtures/[id]/weather/route.test.ts` | ~4 |
| `src/app/api/fixtures/[id]/route.test.ts` (weatherSnapshots update) | 2 |
| **Total added this packet** | **42** |

**Total suite: 239 tests across 26 files** (197 PACKET-003 base + 42 added).

### Coverage (thresholds: 70% statements / 60% branches / 70% functions / 70% lines)

| Metric | Result |
|--------|--------|
| Statements | 94.92% ✅ |
| Branches | 85.03% ✅ |
| Functions | 93.61% ✅ |
| Lines | 94.92% ✅ |

### E2E

| Spec | Result |
|------|--------|
| `e2e/smoke.spec.ts` — homepage loads | ✅ |
| `e2e/smoke.spec.ts` — health endpoint returns 200 | ✅ |
| `e2e/happy-path.spec.ts` — full broker workflow | ✅ |
| **Total: 3 specs** | ✅ |

---

## Deployment Notes

1. **No migration needed** — `WeatherSnapshot` (with nullable `fixtureId`) already existed in the PACKET-002 schema. `npx prisma migrate deploy` is a no-op for this packet.
2. **No new environment variables** — Open-Meteo is free and keyless. No secrets required.
3. **Re-seed recommended** — run `npx prisma db seed` to add the 2 new `WeatherSnapshot` rows. The E2E uses seeded data; existing rows from a previous seed are harmless (idempotent seed logic).
4. Node.js 20+ required (unchanged from PACKET-002).

---

## Validation

```bash
npm run typecheck         # ✅ 0 errors
npm run lint              # ✅ 0 errors
npm run test              # ✅ 239/239 passing (26 files)
npm run test:coverage     # ✅ 94.92% / 85.03% / 93.61% / 94.92%
npm run test:e2e          # ✅ 3/3 specs passing (2 smoke + 1 happy-path)
npm run build             # ✅ First Load JS shared: 102 kB (budget < 200 kB)
```

## Testing Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run test` passes (239 tests, 26 files)
- [ ] `npm run test:coverage` meets all four thresholds
- [ ] `npm run test:e2e` passes — 3 specs (2 smoke + 1 happy-path)
- [ ] `npm run build` succeeds — First Load JS shared ≤ 200 kB
- [ ] `GET /api/weather/marine?lat=57.15&lng=-2.09` returns a verdict with `fixtureId: null`
- [ ] Missing `lng` param → HTTP 400
- [ ] `GET /api/fixtures/:id` (seeded fixture2 or fixture3) returns `weatherSnapshots.length >= 1`
- [ ] `POST /api/fixtures/:id/weather` persists a snapshot and returns a non-null `fixtureId`
- [ ] Full happy-path E2E spec passes end-to-end
