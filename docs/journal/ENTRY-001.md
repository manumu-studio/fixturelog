# Entry 1

**Date:** 2026-06-11
**Type:** Feature
**Branch:** `feat/spine-foundation`
**Version:** `0.2.0`
**Packet:** `PACKET-001 — Spine Foundation`
**PR:** `PR-0.2.0`

## Summary

Built the FixtureLog spine foundation from research/planning into a working project base. This packet established the product direction, ratified the core architecture decisions, created the Next.js/TypeScript/Prisma foundation, added seed data, introduced health checks and tests, and wired CI.

The public repository is intentionally packet-based and privacy-safe: no private preparation notes, named contacts, meeting details, or timeline-specific language are included.

## Key Decisions

- **Research-first packet methodology:** captured in `ADR-0001`; implementation follows explicit packets, ADRs, task files, and living-doc updates.
- **Seeded data plus one real API:** `ADR-0002` ratifies seeded PostgreSQL commercial data with Open-Meteo Marine as the only real external API in the MVP.
- **Next.js full-stack architecture:** `ADR-0003` chooses App Router, Route Handlers, Prisma, and a service layer over a separate API service.
- **Canonical broker vocabulary:** `SPEC-001` locks Requirement and Fixture status models using offshore broking language such as `ENQUIRY`, `NEGOTIATING`, `ON_SUBS`, and `FIXED`.
- **Core service boundaries:** `FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, and `FixtureStatusPolicy` are named as the main application services.
- **Deterministic recap path:** recap generation is a tested formatter over structured fixture terms, not runtime LLM output.
- **CI/security cleanup:** removed unused `happy-dom` test environment usage so the high-severity npm audit gate is not blocked by an unnecessary dev dependency.

## Files Created

- `docs/decisions/ADR-0001-research-first-methodology.md`
- `docs/decisions/ADR-0002-data-and-integration-strategy.md`
- `docs/decisions/ADR-0003-application-architecture.md`
- `docs/specs/SPEC-001-mvp-build.md`
- `docs/build-packets/PACKET-001-spine-foundation.md`
- `docs/pull-requests/PR-0.2.0.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `eslint.config.mjs`
- `next.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/api/health/route.ts`
- `src/lib/prisma.ts`
- `src/lib/health.ts`
- `src/lib/health.test.ts`
- `e2e/global-setup.ts`
- `e2e/smoke.spec.ts`
- `.github/workflows/ci.yml`
- `.env.example`
- `.gitignore`

## Files Modified

- `README.md`
- `CHANGELOG.md`
- `docs/architecture/PROJECT-CONTEXT.md`
- `docs/roadmap/ROADMAP.md`
- `.clauderules`
- `.cursorrules`

## Validation

- `npm audit --audit-level=high` passes the high-severity gate after removing unused `happy-dom` usage. The remaining PostCSS advisory is a moderate transitive Next.js advisory and is not fixed with `npm audit fix --force`.
- `npm audit --audit-level=high --omit=dev` passes the high-severity gate.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm test` passes.

## Next Step

Begin `PACKET-002 — Core Vertical Slice`: vessel list, requirement/fixture route handlers, status workflow, matching service, and deterministic recap generation.
