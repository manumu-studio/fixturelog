# STAGE 0 — GROUNDING & FIRST-ROUND DELTA
**Chain:** FixtureLog → SSY offshore-broking demo | **Stage:** 0 of 5 (+ synthesis)
**Mode:** No web. Read-only. Local artifacts + codebase only.
**Goal of the demo (do not drift from this):** Land the SSY Full-Stack Developer role.
Optimize every finding toward proving offshore-broker domain understanding + disciplined AI use.
**Focus:** Offshore / OSV only (PSV, AHTS, ERRV; North Sea). Ignore SSY's other desks.
**Governing rule:** Obeys `../RESEARCH-CHAIN-PROTOCOL.md` — Outcome-First, Relevance Gate, Two-Party Calibration, Directional Verdict.

## 🎯 Defined Outcome (Principle 1 — one sentence)
Produce the ground-truth map of FixtureLog as it stands today — what is REAL vs SEEDED vs BARE,
what the first research round already settled, and the exact gap list — so Stage 1 can be scoped
without re-reading the repo, and so we learn whether our current direction is the real path.

## Why this stage exists
Before any web research, establish ground truth: what FixtureLog actually is today,
what the first investigation round already settled, and the precise gaps that scope
Stages 1–5. This prevents re-researching closed questions and prevents Stage 1 from
guessing at a current state it never read.

## Inputs to read — in this order (all bundled in this folder)
1. **Ratified decisions & contracts** (binding unless superseded):
   - `01-decisions/` — ADR-0001 (research-first) … ADR-0005 (text-first shared broker brain)
   - `02-specs/SPEC-001-mvp-build.md` and `02-specs/SPEC-002-shared-broker-brain.md`
2. **First-round research** (the body we build ON, never repeat):
   - Every file in `03-first-round-research/` — read fully, note date and confidence of each.
     Key files: SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE, SSY-OFFSHORE-GLOSSARY,
     SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT, SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH,
     AI-BROKER-COPILOT-RESEARCH, the deep-research reports, the compass_artifact exports.
3. **Primary interview evidence:**
   - `05-interview-PENDING/` — SSY meeting transcript + job spec.
   - IF ABSENT/EMPTY: do not invent contents. Mark every transcript/job-derived claim
     `UNVERIFIED — interview material pending` and proceed.
4. **Current state of the product** (what a broker would actually see):
   - `06-current-state/` — dashboard, requirements, charterers, map, portal-fixtures, `seed.ts`
   - Distinguish **real/live** data (Open-Meteo weather, real IMOs/vessel imagery) from **seeded** data.
5. **Living-doc current-state claims** (to detect drift):
   - `04-living-docs/` — README, ROADMAP, PROJECT-CONTEXT, INCIDENT_REGISTRY, GLOSSARY.

## Method
- **Pass A — Decision-Memory Step 0.** From inputs 1–2, produce three lists:
  **(a) Binding decisions** (ratified, not to be reopened);
  **(b) Superseded / obsolete material**; **(c) Genuinely unresolved questions.**
  Only items in (c) are eligible to become later-stage research.
- **Pass B — Current-state teardown.** For each page/feature, classify every visible element
  as `REAL` | `SEEDED` | `BARE/STUB/PLACEHOLDER`, with an evidence path (`file:line`) per claim.
  Call out the known offenders: Requirements (8× identical Equinor/PSV/North Sea/FIXED/8000),
  Charterers (plain list), Dashboard (3× duplicate "Skandi Olympia", "No weather snapshot yet").
- **Pass C — First-round coverage map.** Summarize what `03-first-round-research/` already
  answered, labeled `CONFIRMED | LIKELY | INFERENCE | UNVERIFIED`. CONFIRMED/LIKELY items are
  out of scope for re-research.
- **Pass D — Gap & relevance synthesis.** Derive the gaps round 1 missed, tag each to the
  Stage (1–5) that will close it, and draw the in-scope / out-of-scope boundary for an
  offshore-broker demo aimed at SSY.

## Confidence labels
Tag every non-trivial claim: `CONFIRMED` (read it directly), `LIKELY`, `INFERENCE`,
`UNVERIFIED`. No claim about the transcript or the job without a label.

## Required output (this becomes Stage 1's only input)
1. **Decision ledger** — the three lists from Pass A.
2. **Current-state inventory table** — page → element → REAL/SEEDED/BARE → evidence path.
3. **First-round coverage map** — what's already settled (so Stages 1–5 don't repeat it).
4. **Gap list** — each gap → which Stage closes it → why it matters to a broker / to SSY.
5. **Relevance boundary** — explicit "in scope" vs "out of scope" for the demo.
6. **Hand-off to Stage 1** — the exact questions Stage 1 ("the offshore broker's day &
   pain points") must answer, written so Stage 1 can run without re-reading this repo.
7. **Independence note** — for each gap, only whether it can ship **independently** of the
   others (one PR = one story). Do NOT attach time/effort estimates or deadlines — those are
   decided **jointly, later, from results** (Principle 5). Pre-judging duration here drops options.
8. **Directional Verdict** (Principle 4 — REQUIRED) — end with exactly ONE of:
   - `WRONG PATH` — the current direction won't lead anywhere; state the better way + why;
   - `RIGHT, BUT REFOCUS` — what to add, what to drop, what to ignore;
   - `NOVEL / UNEXPLORED` — a direction no one seems to have implemented;
   - `VALIDATED / EXISTING` — this matches established practice; name what it is.
   The verdict MUST carry its reasons **and** the concrete next move. A verdict without both is invalid.

## Hard constraints
- No web access; no external claims.
- Do NOT propose fixes or designs yet — this stage only establishes ground truth and gaps.
- Never present SEEDED data as REAL; never claim access to private SSY data.
- If a living doc contradicts the code, report the drift; do not "correct" history.
- Evidence-first: a claim without a `file:line` or a confidence label is not allowed.

## Pre-Launch Checklist (per RESEARCH-CHAIN-PROTOCOL.md)
- [x] **Outcome** defined in one sentence (see 🎯 above)
- [x] **Relevance** typed: missing-data (current-state) + info-gap (first-round delta) → feeds Stage 1
- [x] **Lead decided:** Claude Code leads Stage 0 (no-web, in-project grounding). Claude.ai takes the lead from Stage 1 (web breadth).
- [x] **Directional verdict** required in output (item 8)
- [x] **Hand-off** to Stage 1 specified (output item 6)
- [x] **No premature estimates** — item 7 carries independence only, no durations (Principle 5)
