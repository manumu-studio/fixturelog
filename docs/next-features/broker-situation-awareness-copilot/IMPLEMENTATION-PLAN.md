# Broker Situation Awareness Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broker-only situation-awareness copilot that stores recent external signals around a fixture and summarizes them without making decisions.

**Architecture:** Add a small evidence pipeline beside the existing fixture workflow. Source adapters collect recent signals, Zod validates them, Prisma persists `SignalDigest` and `SignalEvidence`, React displays the digest, and the broker copilot reads stored evidence only.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Prisma, PostgreSQL, Vitest, Playwright, existing Broker Copilot.

## Global Constraints

- Preserve ADR-0004: every write remains human-in-the-loop.
- Preserve ADR-0005: no RAG until a curated corpus exists.
- The first slice is report-only and does not block `ON_SUBS -> FIXED`.
- Use soft language: `No new signal`, `Heads-up`, `Needs broker attention`, `Source unavailable`.
- Do not use `safe`, `cleared`, `approved`, `compliant`, or `blocked` for this feature.
- Zod-validate every API body and every external source response.
- Social media is weak evidence only.
- The copilot answers from stored evidence and refuses legal/commercial decisions.

---

## File Structure

| Path | Responsibility |
|---|---|
| `prisma/schema.prisma` | Add `SignalDigest`, `SignalEvidence`, and signal enums. |
| `src/lib/validators/situation-digest.validators.ts` | Request and source-evidence schemas. |
| `src/lib/services/situation-awareness/types.ts` | Shared service interfaces and DTOs. |
| `src/lib/services/situation-awareness/fixture-context.ts` | Load fixture context for source queries. |
| `src/lib/services/situation-awareness/source-adapters/local-fixture-source.ts` | Deterministic adapter for tests and demos. |
| `src/lib/services/situation-awareness/classify-signal-digest.ts` | Soft classifier for digest state. |
| `src/lib/services/situation-awareness/create-situation-digest.ts` | Orchestrates adapters and persistence. |
| `src/lib/services/situation-awareness/get-situation-digest.ts` | Reads latest digest and maps to UI DTO. |
| `src/app/api/fixtures/[id]/situation-digest/route.ts` | Broker-only GET/POST route. |
| `src/app/api/fixtures/[id]/situation-digest/[digestId]/review/route.ts` | Broker-only review route. |
| `src/components/portal/SituationDigestPanel/` | React panel on fixture/detail or dashboard surface. |
| `src/lib/services/copilot/tools/get-situation-digest.tool.ts` | Read-only copilot tool for stored evidence. |

## Task 1: Schema And Validators

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/validators/situation-digest.validators.ts`
- Test: `src/lib/validators/situation-digest.validators.test.ts`

**Interfaces:**
- Produces: `RefreshSituationDigestRequestSchema`, `ReviewSituationDigestRequestSchema`, `SourceEvidenceSchema`
- Produces Prisma models: `SignalDigest`, `SignalEvidence`

- [ ] Add signal enums and models to `prisma/schema.prisma`.
- [ ] Generate a Prisma migration with `npx prisma migrate dev --name situation_awareness_digest`.
- [ ] Add Zod validators for refresh body, review body, and source evidence.
- [ ] Add validator tests for accepted windows `24`, `48`, `72`, invalid window rejection, review note bounds, and malformed source evidence rejection.
- [ ] Run `npx prisma generate`.
- [ ] Run `npx vitest run src/lib/validators/situation-digest.validators.test.ts`.

## Task 2: Fixture Context Loader

**Files:**
- Create: `src/lib/services/situation-awareness/types.ts`
- Create: `src/lib/services/situation-awareness/fixture-context.ts`
- Test: `src/lib/services/situation-awareness/fixture-context.test.ts`

**Interfaces:**
- Produces: `loadFixtureSituationContext(fixtureId: string): Promise<SituationFixtureContext | null>`

- [ ] Define `SituationFixtureContext` with fixture, vessel, owner, operator, charterer, region, port, route, and status fields.
- [ ] Write a failing test for a missing fixture returning `null`.
- [ ] Write a failing test that maps a full fixture to `SituationSourceQuery` fields.
- [ ] Implement the Prisma query with the same relation style used by fixture detail APIs.
- [ ] Run the context loader tests.

## Task 3: Deterministic Local Source Adapter

**Files:**
- Create: `src/lib/services/situation-awareness/source-adapters/local-fixture-source.ts`
- Test: `src/lib/services/situation-awareness/source-adapters/local-fixture-source.test.ts`

**Interfaces:**
- Produces: `createLocalFixtureSourceAdapter(seed: SituationSourceEvidence[]): SituationSourceAdapter`

- [ ] Implement the adapter interface.
- [ ] Validate seeded evidence through `SourceEvidenceSchema`.
- [ ] Add tests proving the adapter filters by `windowHours`.
- [ ] Add tests proving invalid seeded evidence fails loudly.
- [ ] Run adapter tests.

## Task 4: Soft Digest Classifier

**Files:**
- Create: `src/lib/services/situation-awareness/classify-signal-digest.ts`
- Test: `src/lib/services/situation-awareness/classify-signal-digest.test.ts`

**Interfaces:**
- Produces: `classifySignalDigest(evidence: SituationSourceEvidence[], sourceFailures: string[]): SignalDigestState`

- [ ] Add test: no evidence and no failures -> `NO_NEW_SIGNAL`.
- [ ] Add test: one low-confidence social item -> `HEADS_UP`.
- [ ] Add test: multiple independent news items -> `NEEDS_BROKER_ATTENTION`.
- [ ] Add test: official warning -> `NEEDS_BROKER_ATTENTION`.
- [ ] Add test: all configured sources failed -> `SOURCE_UNAVAILABLE`.
- [ ] Implement classifier with no `SAFE`, `CLEAR`, or `BLOCKED` output.
- [ ] Run classifier tests.

## Task 5: Digest Orchestrator And Persistence

**Files:**
- Create: `src/lib/services/situation-awareness/create-situation-digest.ts`
- Create: `src/lib/services/situation-awareness/get-situation-digest.ts`
- Test: `src/lib/services/situation-awareness/create-situation-digest.test.ts`

**Interfaces:**
- Consumes: `SituationSourceAdapter`, `loadFixtureSituationContext`, `classifySignalDigest`
- Produces: `createSituationDigest(fixtureId: string, windowHours: 24 | 48 | 72): Promise<CreateSituationDigestResult>`
- Produces: `getLatestSituationDigest(fixtureId: string): Promise<SituationDigestSummary | null>`

- [ ] Add test: missing fixture returns not-found result and writes nothing.
- [ ] Add test: adapter evidence is persisted as `SignalEvidence`.
- [ ] Add test: adapter failure creates digest with `SOURCE_UNAVAILABLE` when all sources fail.
- [ ] Add test: mixed success/failure persists successful evidence and keeps source failure copy out of natural-language proof.
- [ ] Implement transaction for digest and evidence creation.
- [ ] Run service tests.

## Task 6: Broker API Routes

**Files:**
- Create: `src/app/api/fixtures/[id]/situation-digest/route.ts`
- Create: `src/app/api/fixtures/[id]/situation-digest/route.test.ts`
- Create: `src/app/api/fixtures/[id]/situation-digest/[digestId]/review/route.ts`
- Create: `src/app/api/fixtures/[id]/situation-digest/[digestId]/review/route.test.ts`

**Interfaces:**
- Consumes: `RefreshSituationDigestRequestSchema`, `ReviewSituationDigestRequestSchema`, `createSituationDigest`, `getLatestSituationDigest`

- [ ] Add route tests for anonymous `401`.
- [ ] Add route tests for charterer `403`.
- [ ] Add route tests for invalid body `400`.
- [ ] Add route tests for missing fixture `404`.
- [ ] Add route tests for valid POST returning digest DTO.
- [ ] Add route tests for GET latest digest.
- [ ] Add review route tests for note validation and session-derived broker actor.
- [ ] Implement routes with `requireBrokerApi()`.
- [ ] Run route tests.

## Task 7: Broker UI Panel

**Files:**
- Create: `src/components/portal/SituationDigestPanel/SituationDigestPanel.tsx`
- Create: `src/components/portal/SituationDigestPanel/SituationDigestPanel.types.ts`
- Create: `src/components/portal/SituationDigestPanel/SituationDigestPanel.module.css`
- Create: `src/components/portal/SituationDigestPanel/index.ts`
- Create: `src/components/portal/SituationDigestPanel/useSituationDigestPanel.ts`
- Test: `src/components/portal/SituationDigestPanel/SituationDigestPanel.test.tsx`

**Interfaces:**
- Consumes: `SituationDigestSummary`
- Produces: reusable panel with refresh, evidence list, review note, source timestamps

- [ ] Render empty state: "No situation digest yet."
- [ ] Render `HEADS_UP` with source list and timestamps.
- [ ] Render source-unavailable state without implying safety.
- [ ] Add refresh button calling POST route.
- [ ] Add reviewed note form calling review route.
- [ ] Add tests for copy boundaries: no "safe", "cleared", "approved", "compliant", or "blocked".
- [ ] Integrate panel into the chosen broker fixture surface.

## Task 8: Read-Only Copilot Tool

**Files:**
- Create: `src/lib/services/copilot/tools/get-situation-digest.tool.ts`
- Modify: `src/lib/services/copilot/tools/build-copilot-tools.ts`
- Modify: `src/lib/services/copilot/copilot-prompt.ts`
- Test: `src/lib/services/copilot/tools/get-situation-digest.tool.test.ts`
- Test: existing copilot agent tests with one new refusal case

**Interfaces:**
- Produces read tool: `getSituationDigest({ fixtureId })`

- [ ] Add read-only tool returning latest stored digest.
- [ ] Do not add any write tool for this feature.
- [ ] Update prompt: answer from stored digest only; refuse safety/legal/close-deal decisions.
- [ ] Test that no digest returns "I do not have enough evidence."
- [ ] Test that "Can I close the deal?" is refused.
- [ ] Test that answer includes source names and timestamps when evidence exists.

## Task 9: Documentation Closeout

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `docs/journal/ENTRY-020.md`
- Create: `docs/pull-requests/PR-situation-awareness-copilot.md`

**Requirements:**
- Explain the feature as awareness, not clearance.
- Update current-state docs if the feature ships.
- Do not retroactively edit historical snapshots.

- [ ] Add README section for broker situation-awareness digest.
- [ ] Add CHANGELOG entry.
- [ ] Add journal entry with decisions and trade-offs.
- [ ] Add PR doc with validation steps.
- [ ] Run final verification.

## Verification Commands

Run targeted checks during tasks:

```bash
npx vitest run src/lib/services/situation-awareness
npx vitest run src/app/api/fixtures/[id]/situation-digest
npx vitest run src/components/portal/SituationDigestPanel
```

Run full checks before completion:

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
npm run test
npm run build
```

## Spec Coverage Review

- Product framing: covered by README and ADR.
- Source strategy: covered by `SOURCE-STRATEGY.md`.
- API/data model: covered by `API-DATA-MODEL.md`.
- Build steps: covered by tasks 1-9.
- Tests: covered by `TEST-PLAN.md` and task-level tests.
- Docs closeout: task 9.

## Execution Choice

When ready to build:

1. Subagent-driven execution: one task per worker, review after each task.
2. Inline execution: implement tasks sequentially in the current session.

Recommended: subagent-driven execution, because this feature touches schema, services, routes, UI,
copilot tools, and docs.
