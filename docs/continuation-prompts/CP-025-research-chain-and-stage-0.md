# CP-025 — Research Chain + Stage 1 Cross-Check (FixtureLog → SSY)

**Branch:** rescue/voice-logo-mixed-2026-06-17
**Status:** READY

## Matter split

This is **Matter B** from mixed session `019ee483-2c58-7b03-8766-31eb37e41b90`.
It owns the research-stage chain only.

Keep this separate from **Matter A / CP-024**, which owns the currently active product/build work
for the private-build landing and copied research snapshot typecheck incident.

## Current state
You (Claude Code) built a project-specific research-and-decision system this session and ran Stage 0:
- **Protocol:** `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` — 5 principles (Outcome-First, Relevance Gate, Two-Party Calibration, Directional Verdict, Estimation Deferred & Joint).
- **Stage 0 pack:** `docs/research-V2/stage-0-pack/` — complete and grounded; interview evidence RECEIVED (transcript `ssy-interview-transcript-2026-06-15.md`, `ssy-job-spec.md`, `interview-emails.md`, `manu-cv-ssy.md`); real current-state code in `06-current-state/`.
- **Stage 0 output:** `docs/research-V2/STAGE-0-OUTPUT-grounding.md` — verdict `RIGHT, BUT REFOCUS`. FixtureLog is already a near-complete offshore-broking tool (15-model domain, matching engine, weather verdicts, recaps, **grounded human-in-the-loop copilot**, voice). Genuine gaps: (1) `/requirements` + (2) `/charterers` are functional but raw unstyled tables; (3) **no sanctions/operator-risk screening** (Joe's named daily pain); (4) positions SEEDED-only (schema supports AIS).
- **Stage 0.1 cleared:** `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md` exists and says Stage 1 is cleared. Required Stage 1 prompt/pack edits were applied.
- **Stage 1 candidate report exists:** `docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md`.
- **Stage 1 cross-check is done:** `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md` reconciles the Compass report against the Stage 0.1 ledger, the updated Stage 1 prompt, and live repo truth.
- **AI confabulation incident resolved:** `docs/incidents/INCIDENT-AI-confabulated-task-premise.md` moved to `RESOLVED` after Stage 0 + Stage 0.1 completed the re-anchor work and the user accepted Stage 0.1.
- **Codex handoff:** `docs/research-V2/CODEX-HANDOFF-research-decision-system.md`.
- **Methodology repo:** `../manumu-operating-system/` (sibling) — README, OPERATING-SYSTEM, STORY (3 voice placeholders), THE-BREAKAGE-DIVIDEND, research prompt. UNCOMMITTED; needs initial commit + push.

## The ONE next action
Stage 0.1 cleared; Stage 1 cross-check done — next is **Codex build planning** for the sanctions/operator-risk slice, using `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md` as the planning input.

## Blockers / watch-outs
- Do **not** re-run Stage 1 web research unless the user explicitly asks. The Compass report is reconciled as usable.
- Do **not** run Matter A code gates under this CP. This is the research-stage matter only.
- The lesson from the resolved AI incident remains binding: confidence-label every claim; `file:line` or it didn't happen; if the source isn't in view, say so — never reconstruct silently.
- **Everything is UNCOMMITTED** — Manu runs all git ops. The `manumu-operating-system` repo needs its initial commit.
- Disk near-full (`ENOSPC`); don't run builds/installs without freeing space.
- **Hold the aim:** do NOT let interview-logistics (email/prep brief) or any research output redefine the mission — the mission is the FixtureLog build chain (Principle 1).

## Files to read first (cold start)
1. `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md` (current planning input)
2. `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md` (binding decisions and settled context)
3. `docs/research-V2/STAGE-1-PROMPT.md` (final Stage 1 constraints)
4. `docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md` (reconciled candidate report)
5. `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` (the rules)
6. `docs/research-V2/CODEX-HANDOFF-research-decision-system.md` (system handoff)
