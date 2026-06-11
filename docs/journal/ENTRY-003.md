# Journal Entry 003 — Blockers Resolved: ADR-0002, ADR-0003, SPEC-001 Locked

- **Date:** 2026-06-11
- **Type:** Decision / Planning
- **Branch:** main
- **Version:** 0.0.0 (pre-implementation)

---

## Summary

A grilling session worked through every open blocker from ENTRY-002 and ratified the FixtureLog MVP plan. The decisions are now authoritative and override anything conflicting in `docs/research/`. The session produced two ADRs — `docs/decisions/ADR-0002-data-and-integration-strategy.md` (data + integration) and `docs/decisions/ADR-0003-application-architecture.md` (architecture) — plus the build spec `docs/specs/SPEC-001-mvp-build.md`. Timeline is settled: lock the spec + ADRs now as the Monday 15-Jun 1st-stage talking artifact (domain fluency + architecture), then build properly over ~1 week as 2nd-stage material. No fragile demo for the 30-minute first stage.

## Key decisions (and why)

- **Lock now, build over a week (D1).** The 1st stage is conversational, so the spec and ADRs *are* the talking artifacts — domain fluency and a defensible architecture matter more than running code on Monday. Rushing a fragile demo into 30 minutes is the wrong bet; a deployed thin slice for a likely 2nd technical stage is the right one.

- **Next.js full-stack with a service layer (ADR-0003).** App Router + Route Handlers on the **Node** runtime (not edge) + Prisma, one deploy unit on Vercel, with named pure services: `FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, `FixtureStatusPolicy`. *Why:* (1) CI/CD parity with learning-speaking-app is near-free — same Next.js 15 + Prisma + Postgres shape, so we copy `ci.yml`/`playwright.config`/`vitest.config`; (2) it matches the JD stack (React/TS/Node/PostgreSQL) and a single Vercel deploy means less ops; (3) the service layer keeps it reading like a real API project and stays extractable into a standalone service later. *Rejected:* separate Node/Express API + React SPA — doubles CI/CD work, adds CORS/env complexity, and diverges from the reference pipeline.

- **Canonical status enums (D3, D4).** `Fixture.status`: `DRAFT → NEGOTIATING → ON_SUBS → FIXED → COMPLETED`, plus terminal `FAILED` (reachable from NEGOTIATING or ON_SUBS). FIXED *is* "clean fixed" (all subjects lifted = binding) — we note the equivalence rather than adding a separate `CLEAN_FIXED` value. `Requirement.status`: `ENQUIRY → SHORTLISTED → NEGOTIATING → ON_SUBS → FIXED`, plus terminal `LOST`. *Why:* authentic broker vernacular ("on subs", "fixed", "it failed") is the domain-fluency signal for the interview; `ENQUIRY` belongs to the Requirement, not the Fixture; the two enums share NEGOTIATING/ON_SUBS/FIXED so a Requirement flips to FIXED when its linked Fixture reaches FIXED, and `SHORTLISTED` maps 1:1 to the matching feature.

- **Seeded Postgres + exactly one real API (ADR-0002).** Seed real-name data (Tidewater/Solstad/DOF/Havila/Island Offshore, real North Sea ports, realistic day-rates — North Sea PSV spot ~GBP 7,134/day, large AHTS spot ~GBP 56,798/day) and integrate **one** live external API: Open-Meteo Marine (free, no key, no signup, ~5 km North Sea, returns wave/swell/wind-wave that drive workability). *Why:* one real integration proves the skill without the cost or flakiness of enterprise AIS — AISStream.io and MarineTraffic/Spire/Kpler are deferred to a README "future work" line, not a day-4 stretch. **Honesty rule:** seeded data is explicitly labelled as seeded in UI and README via `PositionSnapshot.source`/`confidence`; never presented as live.

- **Persist decision-time WeatherSnapshots (D6).** When a broker checks workability, persist a snapshot (wave height, swell, wind-wave, workability verdict, lat/lng, laycan window, `fetchedAt`) linked to the fixture; short-TTL cache for ad-hoc lookups. *Why:* this keeps CI/e2e hermetic (seed a snapshot, Playwright never hits the live API) *and* models decision-time provenance, which is the realistic broker behaviour. *Rejected:* fully on-demand fetching — hammers the API and makes tests non-deterministic.

- **FixtureMatcher is core, not a stretch (D7, D8).** A pure, heavily unit-tested service: hard filters (vessel type, availability window, region, min deck-area / bollard-pull / DP-class) then a tunable weighted 0–100 score (distance proximity + day-rate-vs-budget fit + capability margin). Distance is a Haversine great-circle function in the service layer — pure and fine for ~20–40 vessels. *Why:* this is the technical centerpiece and the likely whiteboard question, so it has to be solid. PostGIS "vessels within N nm" is a day-5 stretch with a written scaling rationale (GiST-indexed `ST_DWithin`), kept out of core to avoid Prisma geography friction.

- **Deterministic recap, no runtime LLM (D9).** `RecapFormatter` is a pure service over the SUPPLYTIME 2017 field set, emitting both Markdown and plain text, exported via copy-to-clipboard (mirrors paste-into-Outlook) and file download. `Recap.version` stays in schema for future regeneration but the UI ships v1 only. *Why:* contract terms demand precision and testability, so no LLM generates them; AI-first development is shown in the README dev-usage note, not in the output path.

- **Scope tiered, map ships last (D10, D-MICROS).** MUST-HAVE core is the seed, Vessel/Requirement CRUD, the matcher shortlist, the fixture board + status workflow with audit trail, the recap generator, the Open-Meteo weather panel, the Leaflet/OSM regional map (built last, lazy-loaded — first to slip under time pressure), tests, and Vercel + Neon deploy with CI/CD and docs. Dashboard and day-rate benchmarking are nice-to-have; PostGIS, AISStream live layer, and a Python FastAPI service are stretch only. *Why:* a thin vertical slice ships first; everything is ranked so time pressure cuts cleanly. Python/FastAPI is excluded from the MVP (TypeScript-only) and noted as a future polyglot option; the README acknowledges SSY's enterprise .NET/SQL Server stack versus the offshore platform's Postgres.

- **CI/CD mirrors learning-speaking-app 1:1 (D11).** Four parallel jobs on `pull_request → main` / `push → main` with concurrency cancel-in-progress: `lint-typecheck` (eslint + strict tsc + `npm audit`), `test-coverage` (vitest --coverage, thresholds 70/60/70/70, Codecov), `build-bundle` (next build + 200 kB First-Load-JS budget + `/api/health` smoke), and `e2e` (needs the other three; Postgres 16-alpine service container + `prisma migrate deploy` + Playwright chromium happy-path). Plus Vercel per-PR previews; a hard deploy-status gate is deferred. *Why:* reusing a proven pipeline makes the parity argument the centerpiece of the architecture story and gets us a green build for almost no setup cost.

## Files created / modified

- `docs/decisions/ADR-0002-data-and-integration-strategy.md` (created)
- `docs/decisions/ADR-0003-application-architecture.md` (created)
- `docs/specs/SPEC-001-mvp-build.md` (created)
- `docs/roadmap/ROADMAP.md` (updated — packet sequencing)
- `docs/architecture/PROJECT-CONTEXT.md` (updated — decision ledger reflected)
- `CHANGELOG.md` (updated — decisions ratified)
- `CONTEXT.md` (updated — private decision context)
- `docs/journal/ENTRY-003.md` (this file)

## Open questions / blockers

- None blocking the build. The two interview-time questions for Joe (whether the offshore platform is on .NET or already React/Node today, and whether this role builds it out or modernises it) remain open but do not gate SPEC-001.

## Next step

Begin the first build packet from `docs/specs/SPEC-001-mvp-build.md`: repo skeleton (Next.js 15 App Router + strict TS config + ESLint complexity caps) + Prisma schema (canonical enums from D3/D4/D-ENUMS) + seed (20–40 real OSVs, owners, charterers, ports, realistic day-rates).
