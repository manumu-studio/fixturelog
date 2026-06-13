# Entry 5

**Date:** 2026-06-13
**Type:** Feature (final MVP packet)
**Branch:** `feat/map-deploy-polish`
**Version:** `1.0.0`
**PR:** `PR-1.0.0`

## Summary

Built the regional vessel map, vessel-positions endpoint, real landing page, Vercel + Neon deploy configuration, and all closing documentation to complete the MVP at v1.0.0. Starting from the PACKET-004 foundation (weather enrichment, hermetic E2E, 239 unit tests), this packet added the full map feature slice (`RegionalMapClient` → `useRegionalMap` → `RegionalMap` / `VesselMarker`), a lightweight positions endpoint with Zod validators, a real landing page replacing the Next.js default, deploy configuration (`NEXT_PUBLIC_APP_URL`, `postinstall: prisma generate`, Leaflet deps), and comprehensive documentation (GLOSSARY, AI-USAGE, updated README, CHANGELOG v1.0.0).

## Key Decisions

- **`ssr: false` dynamic import moved into `RegionalMapClient`** — Next.js 15 does not allow `ssr: false` in Server Components; it is only valid inside a client component. The `/map` page is a server component (with `metadata`) and cannot hold the `next/dynamic` call. Moving the dynamic import into `RegionalMapClient` (marked `"use client"`) keeps the page as a server component while still code-splitting Leaflet into its own bundle chunk. This required inverting the initial design: the client component owns both the data hook and the lazy-loaded map; the page is a thin server wrapper.

- **`CircleMarker` only** — Leaflet's default `L.icon` markers require PNG assets and a bundler configuration to resolve their paths at runtime (a well-known friction point with webpack/Next.js). Using `CircleMarker` from react-leaflet eliminates all asset dependencies: the map renders correctly with zero additional configuration, making the bundle hermetic and the test straightforward.

- **Single-source marker type from `z.enum`** — `VesselPositionItem` is derived directly from the Zod schema in `src/lib/validators/vessel-position.validators.ts` using `z.infer`. The `vesselType` union uses `z.enum` (a string-literal tuple), not `z.nativeEnum` with a Prisma enum. This keeps `@prisma/client` out of the client bundle — the client never imports Prisma types directly; the validator file is the single source of truth for the type.

- **Tests use `renderToStaticMarkup` + inline `vi.mock`** — the repo uses `environment: node` in Vitest (not jsdom), so `@testing-library/react` and DOM rendering are not available. Map component tests use `renderToStaticMarkup` from `react-dom/server` to verify JSX structure server-side, and `vi.mock` inline stubs for react-leaflet components. The map E2E (Playwright) covers the actual browser rendering. This avoids adding jsdom as a dependency while maintaining meaningful unit test coverage.

- **Port markers deferred** — SPEC-001 §4.8 mentions both vessel and port markers on the map. Port markers are not included in v1.0.0 because the schema has no standalone `Port` model with coordinate columns. Port information exists only as string fields (`portName`, `portRegion`) on `PositionSnapshot`. Adding port markers would require either a static port coordinate lookup table or a new `Port` model — a schema change deferred to post-MVP. This is noted in `CHANGELOG.md` and `ROADMAP.md`.

## Files Created

**Validators**
- `src/lib/validators/vessel-position.validators.ts` — `VesselPositionItem` Zod schema + inferred type; `MapVesselPosition` alias; positions response shape

**Feature slice**
- `src/features/map/api.ts` — Zod-parsed fetch helper for `GET /api/vessels/positions`
- `src/features/map/hooks/useRegionalMap.ts` — data fetching hook with loading/error/positions state
- `src/features/map/VesselMarker/VesselMarker.tsx` — CircleMarker + popup, color-coded by vessel type
- `src/features/map/VesselMarker/VesselMarker.types.ts`
- `src/features/map/VesselMarker/index.ts`
- `src/features/map/RegionalMap/RegionalMap.tsx` — presentational Leaflet `MapContainer` + markers
- `src/features/map/RegionalMap/RegionalMap.types.ts`
- `src/features/map/RegionalMap/index.ts`
- `src/features/map/RegionalMapClient/RegionalMapClient.tsx` — client component; owns hook; `next/dynamic` with `ssr: false`
- `src/features/map/RegionalMapClient/RegionalMapClient.types.ts`
- `src/features/map/RegionalMapClient/index.ts`

**Route handler**
- `src/app/api/vessels/positions/route.ts` — `GET /api/vessels/positions`
- `src/app/api/vessels/positions/route.test.ts` — 3 tests

**Page**
- `src/app/map/page.tsx` — server component with metadata, renders `RegionalMapClient`

**Tests**
- `src/features/map/api.test.ts` — 3 tests (Zod-parsed fetch helper)
- `src/features/map/RegionalMap/RegionalMap.test.tsx` — 2 tests (renderToStaticMarkup + vi.mock)
- `src/app/page.test.tsx` — 2 tests (landing page)
- `e2e/map.spec.ts` — 1 hermetic map E2E spec

**Documentation**
- `docs/GLOSSARY.md` — offshore shipbroking + app-specific glossary (all 9 vessel-type abbreviations)
- `docs/AI-USAGE.md` — AI-assisted development workflow; no runtime AI

## Files Modified

- `src/app/page.tsx` — replaced Next.js default with a real FixtureLog landing page
- `.env.example` — added `NEXT_PUBLIC_APP_URL`
- `package.json` — `postinstall: prisma generate`; added `leaflet`, `react-leaflet` to dependencies; `@types/leaflet` to devDependencies; version bumped to 1.0.0
- `README.md` — comprehensive v1.0.0 update (architecture diagram, tech stack, full structure tree, all 22 endpoints, services, testing, deployment runbook)
- `CHANGELOG.md` — `[1.0.0]` entry with port-markers `### Deferred` note
- `docs/architecture/PROJECT-CONTEXT.md` — map architecture, positions endpoint, deployment
- `docs/roadmap/ROADMAP.md` — PACKET-005 and MVP v1.0.0 marked complete; port-markers deferral noted
- `CONTEXT.md` — phase updated to PACKET-005 complete / MVP shipped

## Validation

| Gate | Result |
|------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 250 tests across 30 files |
| Coverage: statements / branches / functions / lines | ✅ Above thresholds (70/60/70/70) |
| `npm run build` — First Load JS shared | ✅ 103 kB (budget < 200 kB); /map 118 kB (Leaflet in separate chunk) |
| `npm run test:e2e` | ✅ 4 specs (2 smoke + 1 happy-path + 1 map) |
| No Prisma migration | ✅ `PositionSnapshot` existed in PACKET-002 schema |
