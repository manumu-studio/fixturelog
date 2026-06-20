# CP-026 — Sanctions slice: ready for implementation session (FixtureLog → SSY)

**Branch:** rescue/voice-logo-mixed-2026-06-17
**Status:** READY

## Matter split
This is **Matter B** (research/decision chain), continued from CP-025. It is now at the **build-planning handoff**.
Keep separate from **Matter A / CP-024** (private-build landing + code gates). Do **not** run code gates
(`typecheck`/`vitest`/`eslint`/`build`/`playwright`) under this CP — they belong to Matter A.

## Current state (the chain is complete through Stage 1 cross-check)
- **Protocol:** `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` — now **6 principles** (Principle 6 = Evidence & Confidence Discipline, graduated from the resolved AI incident).
- **Stage 0:** `STAGE-0-OUTPUT-grounding.md` — verdict `RIGHT, BUT REFOCUS`; FixtureLog is already a near-complete offshore broker tool.
- **Stage 0.1 CLEARED:** `STAGE-0.1-OUTPUT-decision-coverage.md` — decision ledger (8 binding decisions), superseded material, unresolved questions, first-round coverage map. Confirms sanctions was genuinely unresearched (no duplication).
- **Stage 1 candidate:** `stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md` — the Compass sanctions/operator-risk brief.
- **Stage 1 cross-check DONE:** `STAGE-1-CROSSCHECK-compass-sanctions.md` — candidate **RECONCILED** against ledger + repo; verdict `RIGHT, BUT REFOCUS`. Repo claims hold; design conforms to ADR-0004/0005, the `FixtureStatusPolicy`/`FixtureStatusChange` seam, and the no-`CLEAN_FIXED`/no-legal-advice guardrails.
- **Stage 2 build plan DONE:** `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md` — no-code implementation plan for the narrow sanctions/operator-risk slice. Verdict: `READY TO IMPLEMENT`.
- **Research docs preserved:** committed as `443bc5e docs: preserve sanctions research chain`.
- **Stage 3 implementation packet DONE:** `docs/research-V2/STAGE-3-IMPLEMENTATION-PACKET-sanctions-operator-risk.md` — implementation-session handoff for the local-adapter first sanctions/operator-risk slice. Verdict: `READY FOR IMPLEMENTATION SESSION`.
- **Manu decisions recorded:** local normalized fixture adapter first; 24-hour screening freshness with mandatory pre-`FIXED` re-check; true `BLOCKED` is non-overridable by brokers (mark reviewed / escalate / cannot proceed only).
- **Incident RESOLVED:** `INCIDENT-AI-confabulated-task-premise` (registry Active is now empty).
- **Methodology repo:** `../manumu-operating-system/` — UNCOMMITTED; still needs initial commit + push.

## The ONE next action
Start the implementation session from
`docs/research-V2/STAGE-3-IMPLEMENTATION-PACKET-sanctions-operator-risk.md`.

Implementation starts with the local-adapter first slice: local normalized screening fixture schema,
pure classifier tests, additive `Operator` / `ScreeningResult` / `ScreeningReview` /
`Vessel.flagState` model work, deterministic `screen()` service, 24-hour staleness, mandatory
pre-`FIXED` re-check, and non-overridable true `BLOCKED` gate.

## Hard constraints (carried from the ledger — do not re-decide)
- **Deterministic gate only** on BLOCK (no model judgment); copilot conforms to ADR-0004/0005 (explains stored evidence, refuses to conclude, writes human-approved).
- **No `CLEAN_FIXED` enum** (FIXED == clean fixed, SPEC-001 §2).
- **No legal advice / no autonomous compliance** (SPEC-001 §6).
- Denormalized `screeningStatus` is a **provenance-carrying cache** (`screenedAt`/`ttlExpiresAt`); source of truth = `ScreeningResult`.
- **Zod-parse** the local normalized source adapter now and the `yente`/OpenSanctions boundary later; new entities migrate **additively**.
- **UK source = FCDO UK Sanctions List** (OFSI Consolidated closed 28 Jan 2026).
- **No estimates in research** — effort tiers decided jointly at synthesis (Principle 5).

## Decisions recorded
- Data source: local normalized fixture adapter first; preserve seam for self-host OpenSanctions `yente` or direct gov-file ingestion later.
- TTL/staleness: 24 hours for demo-critical screening freshness; mandatory re-check before `FIXED`.
- True BLOCK policy: no broker override; allow only mark reviewed / escalate / cannot proceed.
- Effort tiers remain deferred and joint.

## Blockers / watch-outs
- **Web-lane facts** in the cross-check (lists/sources/licensing/seed-IMOs) are **verify-at-build** — Claude.ai/Manu's lane, not repo-verified.
- Stage 3 packet is uncommitted after the preservation commit; Manu runs all git ops.
- Raw unpacked `docs/research-V2/stage-0-pack/06-current-state/**` snapshots remain unstaged because the pre-commit hook treats copied `.ts/.tsx` evidence as active source. The full evidence bundle is protected in committed `docs/research-V2/stage-0-pack.zip`; see `docs/incidents/INCIDENT-BUILD-research-snapshot-typecheck.md`.
- Disk near-full (`ENOSPC`) — don't run builds/installs without freeing space.
- Principle 6 is binding: confidence-label every claim; `file:line` or it didn't happen; if the source isn't in view, say so.

## Files to read first (cold start)
1. `docs/research-V2/STAGE-3-IMPLEMENTATION-PACKET-sanctions-operator-risk.md` (the implementation-session packet)
2. `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md` (current no-code build plan)
3. `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md` (the reconciled build input)
4. `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md` (the binding decision ledger)
5. `docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md` (the full brief)
6. `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` (the 6 principles)
7. `prisma/schema.prisma` (the live model the slice extends)
