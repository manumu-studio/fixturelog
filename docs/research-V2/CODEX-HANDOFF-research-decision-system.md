# CODEX HANDOFF — The Project-Specific Research & Decision System

**Built:** 2026-06-19 → 2026-06-20 (one long session) · **Authors:** Manu (human authority) + Claude Code (in-project agent)
**For:** Codex (or any fresh agent) starting cold. Read this top-to-bottom once; you'll then have the whole system.
**Status:** Active. Graduation candidate for the `manumu-operating-system` repo.

---

## 0. Cold-start — what this is, in one paragraph

Tonight we built a **calibrated, project-specific research-and-decision system** — a way to run a
chain of research stages where (a) every stage must declare its exact outcome *before* it runs,
(b) two researchers with opposite blind spots cross-check each other, (c) each early stage returns a
blunt verdict on whether the current direction is even worth pursuing, and (d) the human arbitrates
and never lets an AI silently redefine the goal. It exists because the generic, one-size audit Manu
had **did not fit any specific project**. This one is meant to be re-pointed at whatever project is in
front of it. The system was not designed on a whiteboard — it was *forged by the failures we hit
tonight*, and each rule traces back to a specific failure (see §5).

---

## 1. Why this was born (the motivation — do not lose this)

Manu already had a development operating system (`manumu-operating-system/OPERATING-SYSTEM.md`), but
its audit/research layer was **too general** — a generic checklist that "doesn't fit for any specific
project." What he wanted was a **personal audit that depends on the project**: a decision process that
grounds itself in *this* codebase, *this* domain, *this* evidence — and that refuses to spend research
time on questions the project has already answered.

The deeper driver: AI agents are "loyal, endless workers" that accelerate enormously, but if handed
authority without supervision they "can bury a career instead of boosting it." So the system is built
to keep the **human as the decision authority** and to make the AIs *check each other* rather than
run free.

---

## 2. The system — the reusable method

### 2.1 The two researchers (and why both exist)
| Researcher | Strength | Blind spot |
|---|---|---|
| **Claude Code** (in-project) | Deep, exact context: real files, decisions, current state; can cite `file:line` | Narrow world — can't do broad web discovery |
| **Claude.ai** (web research) | Breadth — external practice, many sources, things the repo can't see | No project context → can be confidently wrong about what matters *here* |

Neither is authoritative alone. The whole point is to make them **cross-check**, with **Manu as
arbiter** who passes outputs between them and decides who leads each step.

### 2.2 The five principles (full text lives in `RESEARCH-CHAIN-PROTOCOL.md`)
1. **Outcome-First (paramount).** Every stage states its exact outcome in *one sentence* before it
   runs. Stage N's outcome is the *tool* that enables Stage N+1. No defined outcome → do not run the
   stage (an aimless prompt makes the machine assume what matters → wasted time).
2. **Relevance Gate.** Each output must serve the next step as one of: *missing data*, *info-gap*, or
   *transferable idea*. Otherwise it's noise — cut it.
3. **Two-Party Calibration.** After each output: one party proposes the next move *with reasons*; both
   agree/disagree; the human decides **who leads** next (project-ground-truth → Claude Code; external
   breadth → Claude.ai). Disagreements are surfaced, not averaged.
4. **Directional Verdict** (mandatory for early stages). Every Stage 0/1 output ends with exactly one:
   `WRONG PATH` · `RIGHT, BUT REFOCUS` · `NOVEL / UNEXPLORED` · `VALIDATED / EXISTING` — each with
   reasons **and** a concrete next move.
5. **Estimation is Deferred & Joint.** Research never attaches time/effort estimates — they
   prematurely kill interesting options, and generic developer-velocity numbers don't predict how Manu
   builds. Effort is decided jointly, later, at synthesis (a soft outer horizon may frame the *final*
   plan only).

### 2.3 The chain shape
```
Stage 0  — GROUNDING (no web; Claude Code leads): read the real repo + decisions + prior research +
           primary evidence → map REAL vs SEEDED vs BARE, list what's already settled, derive gaps.
Stage 1+ — NARROW WEB STAGES (Claude.ai leads), scoped ONLY to the gaps Stage 0 surfaced.
Synthesis— independent build plan; effort tiers decided jointly.
```
Early stages are *allowed to change the plan* — that's their job. You run the calibration loop on
Stage 0/1 **until the directional verdict says you're on the real path**, then go deeper.

### 2.4 The "pack" model
Stage 0 runs against a **self-contained input bundle** (`stage-0-pack/`): decisions, specs, prior
research, living docs, primary evidence, and a real snapshot of the current-state code — plus the
stage prompt itself. The pack is the *shared source of truth* both researchers read, so they argue
over the same facts.

---

## 3. How decisions actually get made (the mechanism)

1. **Gate:** is the stage's outcome written in one sentence? (P1) If no → stop.
2. **Relevance:** does the expected output move the next step (missing-data / info-gap / transferable)? (P2) If no → cut.
3. **Run** the stage with whichever party leads.
4. **Cross-check** the output: the *other* party judges it against its own strength. (P3)
5. **Verdict:** the early-stage output must return one of the 4 directional verdicts + next move. (P4)
6. **Human decides** the next stage and who leads it. Estimation is NOT done here (P5).
7. **Loop** until the verdict says "real path," then proceed deeper.

---

## 4. What actually happened tonight (path table — honest, includes the failures)

| # | Action | Artifact produced | Outcome |
|---|--------|-------------------|---------|
| 1 | Interview Manu on the FixtureLog→SSY research goal | (4 locked decisions) | Land-the-role · hybrid data · run+checkpoint · offshore/OSV focus. **Disk hit `ENOSPC` immediately.** |
| 2 | Propose the chain | 5-stage chain (later collapsed) | Provisional plan. |
| 3 | Manu surfaces the meta-layer (his OS doc + AI-workflow research prompt) | `manumu-operating-system/` (README, STORY, OPERATING-SYSTEM, THE-BREAKAGE-DIVIDEND, research/) | The "story of learning" gets a portable home (fixes OS-doc weakness §14.2). |
| 4 | Manu dictates a governance rule | `RESEARCH-CHAIN-PROTOCOL.md` (P1–P4, then P5) | The system's spine. |
| 5 | Assemble Stage 0 inputs | `stage-0-pack/` + `STAGE-0-PROMPT.md` | Self-contained bundle. |
| 6 | Transcript saga | — | Claude Code never received it; **refused to fabricate one**; Manu wrote it from recall with honest provenance. |
| 7 | Two-party calibration live | Claude.ai's Joe-Alexander brief + email/prep brief | Cross-checked by Claude Code against project context. |
| 8 | **Drift caught** | — | Both AIs drifted into interview logistics; Manu: "you got lost." Re-anchored on the build chain. |
| 9 | **Hallucination surfaces** | `INCIDENT-AI-confabulated-task-premise.md` (SEV-2) | Manu asked for the verbatim original prompt; Claude Code couldn't produce it → it had **confabulated the premise** ("bare pages / 8× Equinor / JOURNEY method") and built on it. First AI-reliability incident in the registry. |
| 10 | Re-ground on real evidence | Saved transcript, job spec, emails, CV; enriched pack with real `schema.prisma`, services, validators, 30 API routes | Pack becomes accurate. |
| 11 | Run Stage 0 for real | `STAGE-0-OUTPUT-grounding.md` | **Discovery:** FixtureLog is already a near-complete broker tool (matching, weather, recap, guardrailed human-in-the-loop copilot, voice). Verdict `RIGHT, BUT REFOCUS`: chain collapses to **sanctions screening (Stage 1) + AIS (Stage 4) + 2 UI-polish tasks**. |

---

## 5. The problems → the dividends (this is the part that matters most)

Every rule in the system was paid for by a failure tonight. This is the Breakage Dividend.

1. **Disk `ENOSPC` (recurring).** → *Dividend:* preflight disk before running tools/writing output; reads are cheap, writes/builds are not. Don't proceed on assumptions when blocked.
2. **The hallucination (the big one).** Claude Code reconstructed Manu's request from summarized context + memory, then presented the reconstruction *and unread codebase "facts"* as confirmed truth. It collapsed when asked for the verbatim prompt. → *Dividends:* **(a)** confidence-label every claim about intent or code state (`CONFIRMED` / `INFERENCE` / `UNVERIFIED`); **(b)** when the source isn't in view (post-summarization), **say so — never reconstruct silently**; **(c)** a claim about code needs a `file:line`; **(d)** file it as an incident, don't bury it. See `INCIDENT-AI-confabulated-task-premise.md`.
3. **The drift into interview logistics.** A research output (Claude.ai's brief) quietly redefined the aim from "build the product" to "write the follow-up email." → *Dividend:* Principle 1 is a *standing guard* — the in-project agent must refuse to let an output move the goalposts, and re-state the defined aim when it smells drift.
4. **The time-estimate fight.** Early prompts pre-stamped "3h/1d/2d" tiers, which pruned options before they were judged. → *Dividend:* Principle 5 — research never estimates; effort is a joint call at synthesis; generic dev velocity ≠ Manu's velocity.
5. **Transcript lived only in Claude.ai.** The two researchers were arguing over evidence only one of them could see. → *Dividend:* primary evidence must land in the repo (the shared source of truth) before both parties reason on it.

---

## 6. Artifact map (read these — they are the system)

| File | What |
|---|---|
| `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` | The 5 principles + calibration loop + pre-launch checklist (the spine) |
| `docs/research-V2/stage-0-pack/STAGE-0-PROMPT.md` | The Stage 0 grounding prompt (outcome, method, verdict, checklist) |
| `docs/research-V2/stage-0-pack/` | The self-contained input bundle (decisions, specs, prior research, living docs, interview evidence, current-state code) |
| `docs/research-V2/STAGE-0-OUTPUT-grounding.md` | The grounded current-state teardown + gap list + directional verdict |
| `docs/incidents/INCIDENT-AI-confabulated-task-premise.md` | The hallucination incident (the source of the verify-don't-assume rules) |
| `manumu-operating-system/OPERATING-SYSTEM.md` | The broader dev operating system this plugs into |
| `manumu-operating-system/THE-BREAKAGE-DIVIDEND.md` | Where the §5 dividends should be logged as durable entries |

---

## 7. Where things stand / what's next

- **The chain is refocused** (Stage 0 verdict): NOT "build a broker tool from scratch" (done) — instead:
  1. **Stage 1 (web, Claude.ai):** sanctions / operator-risk screening for offshore broking — the one feature Joe named as a daily decision and the only real research gap.
  2. **Stage 4 (small):** viable free AIS sources (schema already supports `PositionSource.AIS`).
  3. **Two independent UI-polish tasks:** `/requirements` and `/charterers` are functional but raw tables.
- **Open incident:** `INCIDENT-AI-confabulated-task-premise` is `INVESTIGATING` — resolves once the re-anchor (done) + Pass A (decision ledger) + Pass C (first-round coverage) are folded in.
- **Pending Stage 0 passes:** A (decision ledger from ADRs/specs) and C (first-round coverage map from `docs/research/`) — they *refine*, they do not change the verdict.

---

## 8. How Codex should use this

1. **Don't re-derive.** Read §2 + the protocol; apply it. The aim is settled (refocused chain in §7).
2. **Obey the gates.** One-sentence outcome before any stage. Confidence-label every claim. `file:line` or it didn't happen.
3. **Stay in your lane / name it.** If a move needs project ground truth → that's Claude Code's lane; if it needs web breadth → Claude.ai's. Propose with reasons; let Manu arbitrate.
4. **Refuse drift.** If an output starts redefining the goal, stop and re-state the defined aim (§7).
5. **Log dividends.** Any new failure → an incident + an entry in `THE-BREAKAGE-DIVIDEND.md`. Nothing learned is forgotten.
