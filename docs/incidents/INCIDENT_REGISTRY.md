# Incident Registry

## Severity Definitions

| Level | Name | Definition | Postmortem Required |
|-------|------|-----------|-------------------|
| SEV-1 | Critical | Core flow down for all users (auth, fixture pipeline, data persistence) OR any data loss/exposure. No workaround. | Yes |
| SEV-2 | Major | Core feature broken but workaround exists. | Yes |
| SEV-3 | Degraded | Minor degradation, partial loss of non-essential functionality. Limited scope. | Optional |
| SEV-4 | Minor | Cosmetic bugs, dev tooling issues (coverage threshold, flaky tests, build/typecheck breakage). | No |

## Naming Convention

`INCIDENT-PNN-slug.md` where NN = packet number (or a short tag like `LINT`, `E2E`), slug = 2–4 word kebab-case failure mode.

## Active Incidents

| ID | Date | Severity | Failure Mode | Status | File |
|----|------|----------|-------------|--------|------|

## Resolved Incidents

| ID | Date | Resolved | Severity | Failure Mode | Status | File |
|----|------|----------|----------|-------------|--------|------|
| INCIDENT-P09-precommit-comment-token | 2026-06-15 | 2026-06-15 | SEV-4 | Pre-commit hook flags comment token | RESOLVED | docs/incidents/INCIDENT-P09-precommit-comment-token.md |
| INCIDENT-P09-landing-charterers-link-test | 2026-06-15 | 2026-06-15 | SEV-4 | Landing test expects removed charterers link | RESOLVED | docs/incidents/INCIDENT-P09-landing-charterers-link-test.md |
| INCIDENT-P09-vessel-modal-jsx-transform | 2026-06-15 | 2026-06-15 | SEV-4 | Vessel modal JSX transform fails | RESOLVED | docs/incidents/INCIDENT-P09-vessel-modal-jsx-transform.md |
| INCIDENT-P09-broker-enquiry-cta-leak | 2026-06-15 | 2026-06-15 | SEV-4 | Broker sees client enquiry CTA | RESOLVED | docs/incidents/INCIDENT-P09-broker-enquiry-cta-leak.md |
| INCIDENT-P09-next-not-found-page-data | 2026-06-15 | 2026-06-15 | SEV-4 | Next build cannot collect /_not-found page data | RESOLVED | docs/incidents/INCIDENT-P09-next-not-found-page-data.md |
| INCIDENT-P09-optional-classname-typecheck | 2026-06-15 | 2026-06-15 | SEV-4 | Optional className props break typecheck | RESOLVED | docs/incidents/INCIDENT-P09-optional-classname-typecheck.md |
| INCIDENT-P09-appuser-upsert-race | 2026-06-15 | 2026-06-15 | SEV-3 | AppUser upsert race after auth callback | RESOLVED | docs/incidents/INCIDENT-P09-appuser-upsert-race.md |
| INCIDENT-P09-animated-logo-motion-props | 2026-06-14 | 2026-06-14 | SEV-4 | Animated logo Motion props break typecheck | RESOLVED | docs/incidents/INCIDENT-P09-animated-logo-motion-props.md |
| INCIDENT-P09-duplicate-vessel-seed | 2026-06-14 | 2026-06-14 | SEV-4 | Duplicate vessel seed row false alarm | RESOLVED | docs/incidents/INCIDENT-P09-duplicate-vessel-seed.md |
| INCIDENT-P09-stale-next-runtime | 2026-06-14 | 2026-06-14 | SEV-4 | Stale Next runtime artifact blocks local build | RESOLVED | docs/incidents/INCIDENT-P09-stale-next-runtime.md |
| INCIDENT-P008-pnpm-in-npm-project | 2026-06-14 | 2026-06-14 | SEV-4 | pnpm install run in npm-managed FixtureLog repo | RESOLVED | docs/incidents/INCIDENT-P008-pnpm-in-npm-project.md |
| INCIDENT-P02-charterer-new-route-missing | 2026-06-14 | 2026-06-14 | SEV-3 | Missing charterer registration route | RESOLVED | docs/incidents/INCIDENT-P02-charterer-new-route-missing.md |
| INCIDENT-P01-vitest-esm-startup | 2026-06-11 | 2026-06-12 | SEV-4 | Vitest ESM startup failure (Node 18) | RESOLVED | docs/incidents/INCIDENT-P01-vitest-esm-startup.md |
| INCIDENT-P01-npm-audit-critical-dev | 2026-06-11 | 2026-06-12 | SEV-4 | NPM audit critical dev dependency (happy-dom) | RESOLVED | docs/incidents/INCIDENT-P01-npm-audit-critical-dev.md |
| INCIDENT-P02-charterer-detail-html-response | 2026-06-14 | 2026-06-14 | SEV-3 | Charterer detail receives HTML instead of JSON | RESOLVED | docs/incidents/INCIDENT-P02-charterer-detail-html-response.md |

## Preflight Gate Log

| Packet | Date | Decision | Notes |
|--------|------|----------|-------|
| PACKET-003 (TASK-021) | 2026-06-12 | **PASSED** — PACKET-003 cleared to begin | Branch `feat/matching` ✓ · Node v20.20.2 ✓ · disk 38 GB free ✓ · typecheck/lint clean, **99 tests pass** ✓ · seed = 30 vessels / 4 requirements / 6 benchmarks / 7 regions ✓ · `src/lib/services/` + `src/lib/validators/` + `CuidParamSchema` present ✓ · both P01 incidents RESOLVED, no Active SEV-1/SEV-2 ✓ · `Requirement`/`Region`/`RateBenchmark` schema exists → **no migration needed** ✓. **Deviation:** PACKET-002 not merged to `main`; `feat/matching` was branched from `feat/vertical-slice` (which carries the committed PACKET-002 vertical slice), so PACKET-003 stacks on that foundation rather than on `main`. Foundation present and green — gate cleared. |
| PACKET-004 (TASK-030) | 2026-06-12 | **PASSED** — PACKET-004 cleared to begin | Branch `feat/weather-e2e` ✓ · PACKET-003 (`1b01968`) **merged to `main`**, `feat/matching` fully merged → branched from merged main (not stacked) ✓ · working tree clean ✓ · Node v20.20.2 active (after `nvm use`; nvm default had resolved to v18 — must `nvm use 20.20.2` before each build session) ✓ · disk 33 GB free ✓ · `WeatherSnapshot` (nullable `fixtureId`) + `SubjectItem` + `SubjectItemStatus` enum exist → **no migration needed** ✓ · `src/lib/services/` + `src/lib/validators/` + `CuidParamSchema` present, no weather files yet ✓ · no Active SEV-1/SEV-2 ✓ · `SPEC-001 §4.5`/`§4.9` resolve ✓. **Pending:** `npm run typecheck && npm run lint && npm run test` baseline (expected ~195 tests) to be run under Node 20 as the build's first step — not executed from the audit shell (no `node` on PATH there). |
