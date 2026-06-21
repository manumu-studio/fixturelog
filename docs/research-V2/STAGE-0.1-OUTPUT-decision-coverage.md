<!-- Stage 0.1 output: decision ledger (Pass A) + first-round coverage map (Pass C) + Stage 1 readiness verdict. No web; read-only over in-project artifacts. -->

# STAGE 0.1 OUTPUT — Decision Ledger & First-Round Coverage

**Run by:** Claude Code (in-project, no web) | **Date:** 2026-06-20
**Inputs read (in order):** `RESEARCH-CHAIN-PROTOCOL.md`, `STAGE-0-OUTPUT-grounding.md`,
`CODEX-HANDOFF-research-decision-system.md`, `INCIDENT-AI-confabulated-task-premise.md`,
`stage-0-pack/01-decisions/ADR-0001…0005`, `stage-0-pack/02-specs/SPEC-001`+`SPEC-002`,
`stage-0-pack/03-first-round-research/*` (13 files), `STAGE-1-PROMPT.md`, `stage-1-pack/*`.
**Method:** Pass A (decision ledger from ADRs/specs) + Pass C (first-round coverage map) + Stage 1 readiness check.
**Confidence labels:** `CONFIRMED` (file:line read), `LIKELY` (title/grep + corroborating read), `INFERENCE`, `UNVERIFIED`.

> **Scope discipline (incident-binding).** This output is built **only** from in-project artifacts. The
> incoming Compass sanctions brief (`stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md`)
> is **not** folded in here — per CP-025 step 5, cross-checking it is gated *behind* this Stage 0.1 clearing. No
> claim below is stated without a file:line or an explicit confidence label.

---

## 1. Executive Summary

- **Stage 1 is `CLEARED` to launch** — with **minor, optional edits** (one field correction; one status flip). The prompt is well-scoped and the calibration loop has converged on the real path.
- **No duplication risk.** The first-round research **never covered sanctions/operator-risk screening as a feature** — only incidental mentions (SUPPLYTIME's sanctions *clause*, an AIS-spoofing caveat, macro "shadow-fleet" interview color). Sanctions is genuinely unresearched. `CONFIRMED` (grep across `03-first-round-research/`).
- **The AI boundary Stage 1 must honor is already ratified** by ADR-0004 + ADR-0005 + SPEC-002: copilot explains stored evidence with citations, refuses to conclude, writes stay human-approved, high-risk calls are deterministic gates. Stage 1 must **conform, not re-decide**.
- **The enforcement seam sanctions gating must hook into already exists**: the `FixtureStatusPolicy` legal-transition matrix and the `FixtureStatusChange` audit model. `CONFIRMED` ([schema.prisma:367](../../prisma/schema.prisma#L367); SPEC-001 §5).
- **Two product gaps are not Stage 1's job**: live AIS (Stage 4) and the `/requirements` + `/charterers` UI polish (independent in-project build tasks). Stage 1 is *only* gap 3 (sanctions).
- **Several first-round topics are settled or superseded** and must not be reopened: the data/stack strategy (ADR-0002/0003), the canonical status enums (SPEC-001 §2 — no `CLEAN_FIXED` value), the copilot architecture (ADR-0004/0005), auth (built), and all interview-logistics briefs (the documented drift source).
- **Directional verdict holds:** `RIGHT, BUT REFOCUS` is **unchanged** — the decision ledger *reinforces* it (the product is built, the AI boundary is ratified, sanctions is the one unresearched and unbuilt gap).
- **Incident re-anchor items are now complete** (re-anchor done in Stage 0; Pass A + Pass C delivered here) — `INCIDENT-AI-confabulated-task-premise` is eligible to move `INVESTIGATING → RESOLVED` once the user accepts this output.

---

## 2. Binding Decisions

Ratified; **not open for Stage 1 to re-decide**.

| Decision | Evidence path | Why it matters to Stage 1 (sanctions) |
|---|---|---|
| Research-first, packet-based methodology; ADRs are the decision record | `ADR-0001` (L20-24) | Sanctions feature, once chosen, becomes a packet with task files + docs — not ad-hoc code. |
| Seeded Postgres = system of record; **Open-Meteo is the only live API**; AIS deferred post-MVP; **provenance is explicit, seeded ≠ live** | `ADR-0002` (L22-32); `SPEC-001` §2.3, §4.1 | Screening data freshness must be **labelled with list version/date**; a demo serving cached lists must never present stale data as live. Sanctions ≠ AIS — do not pull AIS in. |
| Next.js full-stack monolith, Node runtime, Prisma, **explicit pure service layer** (`FixtureMatcher`, `RecapFormatter`, `WeatherEnricher`, `FixtureStatusPolicy`), Haversine in-service, Vercel+Neon | `ADR-0003` (L20-26); `SPEC-001` §5 | A `screen()` service belongs in this service layer as a **pure, deterministic** unit; route handlers stay thin; matches the existing shape. |
| **Copilot is human-in-the-loop for every write**: read tools auto-execute, write tools `needsApproval`; the deterministic `evaluateTransition` gate is the **only door to the DB**; `brokerId` session-derived; bounded loop; broker-only | `ADR-0004` (L22-44) | **Binding AI boundary.** A sanctions BLOCK must be a deterministic gate (like `evaluateTransition`), not model judgment; the copilot may *explain* a stored result but must not clear/override it. |
| Canonical status vocabulary: `Fixture` `DRAFT→NEGOTIATING→ON_SUBS→FIXED→COMPLETED/FAILED`; `Requirement` `ENQUIRY→SHORTLISTED→NEGOTIATING→ON_SUBS→FIXED/LOST`; **`FIXED` == "clean fixed" (no separate `CLEAN_FIXED`)**; transitions enforced by `FixtureStatusPolicy` | `SPEC-001` §2; `schema.prisma:14,23` | These are the exact transitions a screening gate hooks into. Re-check before `FIXED`; block `ON_SUBS→FIXED` on an unresolved result. **Do not introduce `CLEAN_FIXED`.** |
| Text-first shared broker brain: extract `runBrokerBrain()`; **voice stays hidden**; **never proxy voice through the 5-step loop**; **RAG (`askKnowledgeBase`) deferred until a curated corpus exists** | `ADR-0005` (L26-46); `SPEC-002` §1-4 | Sanctions copilot answers flow through the *same* grounded brain + HITL gate. Do **not** propose voice or RAG as part of the sanctions feature. |
| MVP out-of-scope (locked): **no real charterparty legal text / no legal advice**; live enterprise AIS excluded; SQL Server excluded; Python service excluded | `SPEC-001` §6 "out of scope" | Hard guardrail: the sanctions feature gives **no legal advice** and makes **no autonomous compliance determination** — deterministic match + human review only. |
| Engineering standards (CI-blocking): strict TS (no `any`, no `as` except `as const`), **Zod at every boundary**, 4-file component pattern, complexity caps, additive migrations | `SPEC-001` §7-8 | Any external sanctions-list response is an untrusted boundary → **Zod-parsed**; new entities migrate additively. |

---

## 3. Superseded / Obsolete Material

Do **not** execute or cite these as current.

| Material | Superseded by | What not to do |
|---|---|---|
| Blueprint/KB draft status model with `CLEAN_FIXED` (`ENQUIRY → ON_SUBS → CLEAN_FIXED → FAILED → COMPLETED`) | `SPEC-001` §2 locked enums (`FIXED` == clean fixed) | Don't add a `CLEAN_FIXED` enum value; don't model status off the KB draft. `CONFIRMED` (`SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md:120`). |
| Blueprint draft entity enums (`NEW/MATCHED/...`) | `SPEC-001` §2 / §3 data model | Use the locked schema, not the blueprint drafts. |
| AIS provider research framed as a "day-4 stretch" (AISStream.io etc.) | `ADR-0002` (AIS deferred) → re-scoped to **Stage 4**, not Stage 1 | Don't let Stage 1 research AIS except where a sanctions source depends on vessel identity. `CONFIRMED` (`SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` §3, §8). |
| "Build your own Clerk/Auth0" auth research | Auth already built (PACKET-008, `AppUser`/`AppRole` in `schema.prisma:125,176`) | Don't re-research auth. `LIKELY` (title + schema presence; full file not read). |
| Interview-logistics briefs (Joe-Alexander prep, SSY interview brief, follow-up email strategy) | Principle 1 (hold the aim) — these were the **documented drift source** (`INCIDENT` §contributing-factor 5) | Do **not** treat as product research; out of build scope. `LIKELY` (titles + grep; `compass_*0bda70b1`, `*2d67e95c`, `deep-research-report (2)`,`(5)`). |
| Voice + RAG unification research | `ADR-0005` (voice hidden; RAG deferred until corpus) | Don't reopen voice/RAG inside the sanctions line of work. `CONFIRMED` (`VOICE-COPILOT-RAG-UNIFICATION-DEEP-RESEARCH-REPORT.md`). |

---

## 4. Unresolved Questions

Only questions still eligible for Stage 1+.

| Question | Stage | Why unresolved | Who should lead |
|---|---|---|---|
| Sanctions/operator-risk screening: which lists, where it fits the enquiry→fixture flow, free/cheap data sources, competitor screening features, the narrow feature shape | **Stage 1** | No first-round coverage; needs external/web breadth | **Claude.ai** (web), then **Claude Code** cross-check vs repo |
| Live AIS: viable free sources; does live position materially beat seeded for the demo | Stage 4 | Deferred by ADR-0002; not yet researched for sourcing | Claude.ai (web) |
| `/requirements` list UI polish (raw table → component system) | Build task (independent) | Functional but raw; no research needed | Claude Code (in-project) |
| `/charterers` list UI polish | Build task (independent) | Same | Claude Code (in-project) |
| `askKnowledgeBase` RAG corpus assembly | Deferred packet | Gated on a curated shipbroking corpus existing (ADR-0005) | Joint, later — **not** Stage 1 |

---

## 5. First-Round Coverage Map

What the first-round research already answers, and the instruction for Stage 1.

| Topic | What is already known | Confidence | Source | Stage 1 instruction |
|---|---|---|---|---|
| SSY identity + public offshore product (Fixtures / Requirements / Positions / Live Weather Map) | Dashboard objects mirror FixtureLog's; SSY co-founded Ocean Recap | CONFIRMED | `SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md` §1-2,10 | Reuse as context; **don't re-research**. |
| OSV types & specs (PSV/AHTS/MPSV; DP class, bollard pull, deck area) | Full domain reference | CONFIRMED | `…KNOWLEDGE-BASE.md` §4; `SSY-OFFSHORE-GLOSSARY.md` | Reuse; **don't re-research**. |
| Fixture workflow (enquiry → on subs → clean fixed → recap) | Documented end-to-end | CONFIRMED | `…KNOWLEDGE-BASE.md` §5 | Reuse as the flow to map screening onto. |
| SUPPLYTIME 2017 recap field set — incl. that the 2017 ed. **added a sanctions clause** | Contract field set known | CONFIRMED | `…KNOWLEDGE-BASE.md` §6; `…TECHNICAL-DECISION-RESEARCH.md` §6 | **Note:** sanctions *clause* ≠ sanctions *screening*. Don't mistake one for the other. |
| Data/API/stack strategy (Open-Meteo only live API; Neon/Vercel; AIS providers) | Settled | CONFIRMED | `…TECHNICAL-DECISION-RESEARCH.md`; `ADR-0002/0003` | **Settled — avoid.** AIS = Stage 4. |
| Competitive landscape (Sea/, Veson, Kpler, Signal Ocean, Spinergie, Ocean Recap) — *general* product shape | Known at the platform level | CONFIRMED | `…KNOWLEDGE-BASE.md` §10 | Reuse as the base; **but their sanctions-screening features were NOT covered** → Stage 1 must research that specific angle. |
| AI copilot patterns (grounding, HITL, evals, observability) | Researched then ratified | CONFIRMED | `AI-BROKER-COPILOT-RESEARCH.md`; `compass_*770fa419`; `ADR-0004/0005` | Settled — conform, don't re-derive. |
| Voice / RAG unification | Adversarially evaluated, decided | CONFIRMED | `VOICE-COPILOT-…REPORT.md`; `ADR-0005` | Settled — don't reopen. |
| Landing/global CSS patterns | UI reference only | LIKELY (title+grep) | `SSY-GLOBAL-LANDING-CSS-PATTERN-REPORT.md` | Irrelevant to Stage 1 (belongs to UI-polish tasks). |
| **Sanctions / operator-risk screening (lists, sources, workflow placement, competitor screening features, narrow feature)** | **Not covered** — only incidental: SUPPLYTIME sanctions clause; AIS-spoofing "relevant to sanctions" caveat; macro shadow-fleet interview color | **UNRESEARCHED** | grep: `…KNOWLEDGE-BASE.md:129,174`; `deep-research-report (2).md:45,104` | **This is the gap. Research from scratch — no duplication risk.** |

---

## 6. Stage 1 Prompt Audit

Recommendations for `STAGE-1-PROMPT.md` (and the pasteable `stage-1-pack/`).

**KEEP (sound as written):** the one-sentence outcome (§1); chain rules (§2); current-state ground truth (§3); priority rationale (§4); research scope §7.1-7.5; hard constraints (§8); output format (§9); the directional-verdict requirement (§11). These correctly fence Stage 1 to the gap and forbid the first-pilot drift.

**EDIT (minor):**
1. **Status flip** — header/§0.status still says *"Draft until STAGE-0.1-OUTPUT… exists."* That output now exists and **clears** Stage 1 → flip to `Cleared to launch`. (Apply now.)
2. **Field correction (§5)** — the prompt says *"`Charterer` … Has `name`."* The live model also carries `sector`, `contactName`, `contactEmail`, `contactPhone`, `notes`. `CONFIRMED` ([schema.prisma:143-157](../../prisma/schema.prisma#L143)). Not design-changing (still screened by `name`), but correct it for accuracy. (Apply now.)

**OPTIONAL (belt-and-suspenders, not required):** §7.3 could add an explicit ask to (a) confirm list-access **licensing terms** (open-gov vs commercial) and (b) check any **2026 list migrations** (e.g. UK OFSI consolidated list status). Left optional because they don't change the gap or the verdict.

**REMOVE:** nothing.

---

## 7. Updated Stage 1 Handoff (the exact delta)

Apply before/at launch:

1. `STAGE-1-PROMPT.md` → change status line from `Draft until … STAGE-0.1-OUTPUT … exists` to **`Cleared to launch (Stage 0.1 passed 2026-06-20)`**.
2. `STAGE-1-PROMPT.md` §5 + `stage-1-pack/00-CONTEXT-BRIEF.md` → correct the `Charterer` line to note it also has `sector` + contact fields.
3. `stage-1-pack/README.md` → flip the launch gate to **open** (Stage 0.1 output exists and clears).
4. No change to `stage-1-pack/01-WHY-FIRST-PILOT-FAILED.md` — it is accurate and load-bearing; keep it.
5. **Post-clearance (CP-025 step 5):** the first artifact to cross-check is the existing candidate report `stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md` against this ledger + the live repo. (A preliminary cross-check found its repo claims hold, with one understatement — it implies `Charterer` has only `name`. Full reconciliation belongs to the Stage 1 cross-check step, not here.)

---

## 8. Directional Verdict Check

**`RIGHT, BUT REFOCUS` — UNCHANGED.**

Nothing in the decision ledger or the coverage map contradicts Stage 0's verdict; the evidence **reinforces** it. The binding decisions show the product is built and its AI boundary ratified; the coverage map shows sanctions/operator-risk screening is the single unresearched gap with no duplication; the unresolved-questions table confirms the chain has collapsed to exactly: **Stage 1 (sanctions, now cleared) + Stage 4 (AIS) + two independent UI-polish tasks.**

**Concrete next move:** apply the §7 delta (flip Stage 1 to cleared; fix the `Charterer` line; open the pack gate), then proceed to the **Stage 1 cross-check** — reconcile the Compass candidate report against this ledger and the live repo (Two-Party Calibration, P3), with Manu as arbiter. Effort tiers remain deferred and joint (Principle 5).
