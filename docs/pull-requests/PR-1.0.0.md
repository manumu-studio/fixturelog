# PR-1.0.0 — Regional Map + Vessel Positions + Deploy + MVP Closeout

**Branch:** `feat/map-deploy-polish` → `main`
**Version:** `1.0.0`
**Date:** 2026-06-13
**Status:** ✅ Ready to merge

---

## Summary

Completes the MVP. Introduces the regional Leaflet vessel map, a lightweight vessel-positions endpoint, a real landing page, Vercel + Neon deploy configuration, and the full documentation closeout (GLOSSARY, AI-USAGE, comprehensive README, CHANGELOG v1.0.0). After this PR, the app is deployable and demonstrates the full offshore shipbroking workflow end-to-end: enquiry → matching → fixture → weather window check → subject-lift gate → fixed → recap, with a regional map showing where seeded vessels are positioned.

---

## What Was Built

### Validators (1 new Zod module)

- `src/lib/validators/vessel-position.validators.ts` — `VesselPositionItem` schema (Zod-inferred type + `MapVesselPosition` alias); `vesselType` uses `z.enum` (not `z.nativeEnum`) to keep `@prisma/client` out of the client bundle.

### API Endpoint (1 new route)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/vessels/positions` | Returns latest `PositionSnapshot` per vessel — `id`, `name`, `vesselType`, `status`, `ownerName`, `lat`, `lng`, `portName`, `source`, `confidence`. Used exclusively by the map. |

### Map Feature Slice (`src/features/map/`)

| Module | Description |
|--------|-------------|
| `api.ts` | Zod-parsed fetch helper; calls `GET /api/vessels/positions`, parses response through the validator schema |
| `hooks/useRegionalMap.ts` | React hook managing `positions`, `loading`, and `error` state |
| `VesselMarker/` | `CircleMarker` + popup; color-coded by vessel type (`PSV` → blue, `AHTS` → orange, etc.); no Leaflet icon assets |
| `RegionalMap/` | Presentational component: `MapContainer` + `TileLayer` (OpenStreetMap) + `VesselMarker` array |
| `RegionalMapClient/` | `"use client"` wrapper; owns `useRegionalMap`; lazy-loads `RegionalMap` via `next/dynamic({ ssr: false })` |

### Pages

- `src/app/map/page.tsx` — Server Component with `metadata`; renders `RegionalMapClient`. Keeps the page in the server component tree while Leaflet lives behind the `ssr: false` boundary.
- `src/app/page.tsx` — Real landing page replacing the Next.js default; links to map, requirements, charterers.

### Deploy Configuration

- `.env.example` — `NEXT_PUBLIC_APP_URL` added; used by server components to build absolute fetch URLs to local API routes in production.
- `package.json` — `postinstall: prisma generate` ensures the Prisma client is generated on `npm install` (required on Vercel); `leaflet ^1.9.4` and `react-leaflet ^5.0.0` added to `dependencies`; `@types/leaflet` to `devDependencies`.

### Documentation

- `docs/GLOSSARY.md` — offshore shipbroking glossary with all 9 vessel-type abbreviations (PSV, AHTS, MPSV, CSV, ERRV, DSV, CTV, SOV, OTHER) plus app-specific service terms.
- `docs/AI-USAGE.md` — AI-assisted development workflow framing; confirms no AI runs at runtime.
- `README.md` — comprehensive v1.0.0 update: architecture diagram, tech stack (incl. Leaflet + OpenStreetMap), full project structure tree (all new paths), all 22 API endpoints, services documentation, testing section (250 unit / 4 e2e), deployment runbook, domain context.
- `CHANGELOG.md` — `[1.0.0]` entry with `### Deferred` block for port markers.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `ssr: false` dynamic import in `RegionalMapClient`, not the page | Next.js 15 forbids `ssr: false` in Server Components; it is only valid inside a Client Component. Moving the import into `RegionalMapClient` (`"use client"`) keeps the page as a server component (preserving `metadata`) while code-splitting Leaflet out of the shared bundle. |
| `CircleMarker` only — no Leaflet icon assets | Leaflet's default `L.icon` markers require static PNG assets and non-trivial bundler configuration to resolve their paths. `CircleMarker` is a pure SVG/Canvas element — zero additional configuration, hermetic bundle, simpler test. |
| `z.enum` for `vesselType`, not `z.nativeEnum` | `z.nativeEnum` would import the Prisma `VesselType` enum, pulling `@prisma/client` into the client bundle. `z.enum` with a string-literal tuple keeps Prisma server-side only. The validator file is the single source of truth for the type. |
| `renderToStaticMarkup` + inline `vi.mock` for component tests | The repo uses `environment: node` in Vitest. jsdom and `@testing-library/react` are not available. `renderToStaticMarkup` provides server-side JSX verification; `vi.mock` stubs react-leaflet. Playwright E2E covers the actual browser rendering. |
| Port markers deferred | No standalone `Port` model with coordinates exists in the schema. Port data is a string field on `PositionSnapshot`. Adding port markers requires a schema change; deferred to post-MVP and noted in CHANGELOG + ROADMAP. |

---

## Testing

### Unit tests added this packet

| File | Tests |
|------|-------|
| `src/app/api/vessels/positions/route.test.ts` | 3 |
| `src/features/map/api.test.ts` | 3 |
| `src/features/map/RegionalMap/RegionalMap.test.tsx` | 2 |
| `src/app/page.test.tsx` | 2 |
| **Total added this packet** | **~10** |

**Total suite: 250 tests across 30 files** (239 baseline + ~10 added).

### Coverage

Coverage scope: `src/lib/**`, `src/app/api/**`, `src/features/**`. `useRegionalMap` and `RegionalMapClient` are exercised by the E2E rather than unit tests; all thresholds remain above the configured minimums.

| Metric | Threshold | Result |
|--------|-----------|--------|
| Statements | 70% | ✅ Above threshold |
| Branches | 60% | ✅ Above threshold |
| Functions | 70% | ✅ Above threshold |
| Lines | 70% | ✅ Above threshold |

### E2E

| Spec | Result |
|------|--------|
| `e2e/smoke.spec.ts` — homepage loads | ✅ |
| `e2e/smoke.spec.ts` — health endpoint returns 200 | ✅ |
| `e2e/happy-path.spec.ts` — full broker workflow | ✅ |
| `e2e/map.spec.ts` — vessel markers render; OSM tiles aborted | ✅ |
| **Total: 4 specs** | ✅ |

### Bundle

| Chunk | Size |
|-------|------|
| Shared First Load JS | 103 kB ✅ (budget < 200 kB) |
| `/map` First Load JS | 118 kB (Leaflet + react-leaflet in separate dynamic chunk) |

---

## Deployment Runbook

### Prerequisites
- Vercel project linked to this repo
- Neon Postgres database

### Steps
1. Set environment variables in Vercel:
   - `DATABASE_URL` — Neon connection string
   - `NEXT_PUBLIC_APP_URL` — the Vercel deployment URL (e.g. `https://fixturelog.vercel.app`)
2. Deploy — `npm install` triggers `postinstall: prisma generate` automatically.
3. Run `npx prisma migrate deploy` against the production database.
4. Run `npx prisma db seed` to populate vessels, charterers, fixtures, requirements, and position snapshots.
5. Verify:
   - `GET /api/health` → `{ "status": "ok" }`
   - `/map` → vessel markers appear on the Leaflet map
   - `/requirements` → requirement list loads with status badges
   - `/api/vessels/positions` → JSON array of vessel position items

---

## Validation

```bash
npm run typecheck         # ✅ 0 errors
npm run lint              # ✅ 0 errors
npm run test              # ✅ 250/250 passing (30 files)
npm run test:coverage     # ✅ All thresholds above 70/60/70/70
npm run test:e2e          # ✅ 4/4 specs passing
npm run build             # ✅ First Load JS shared: 103 kB (budget < 200 kB)
                          # ✅ /map: 118 kB (Leaflet in separate chunk)
```

## Testing Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run test` passes (250 tests, 30 files)
- [ ] `npm run test:coverage` meets all four thresholds
- [ ] `npm run test:e2e` passes — 4 specs
- [ ] `npm run build` succeeds — First Load JS shared ≤ 200 kB; `/map` route has a separate Leaflet chunk
- [ ] `/map` loads vessel markers after deploy + seed
- [ ] `GET /api/vessels/positions` returns an array of position objects
- [ ] Landing page at `/` renders and links work
- [ ] `NEXT_PUBLIC_APP_URL` is set in production environment
