<!-- Stage 1 cross-check: reconciles the Compass sanctions candidate brief against the Stage 0.1 decision ledger, the updated Stage 1 prompt, and live repo truth. Two-Party Calibration (Principle 3): Claude Code = repo ground truth. No web. -->

# STAGE 1 CROSS-CHECK — Sanctions / Operator-Risk Screening (candidate brief vs. ledger + repo)

**Run by:** Claude Code (in-project, no web) | **Date:** 2026-06-20
**Candidate reconciled:** `stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md`
**Reconciled against:** `STAGE-0.1-OUTPUT-decision-coverage.md` · `STAGE-1-PROMPT.md` (updated) · live repo
**Protocol:** Principle 3 (Two-Party Calibration). My lane is **repo ground truth**; web-sourced facts are explicitly out of my lane (see §5).
**Scope guard:** sanctions/operator-risk **only**. Generic broker-dashboard research, AIS, voice/RAG, UI polish, and interview logistics are **out of scope** and not reopened here.

---

## 1. Verdict

**`RIGHT, BUT REFOCUS` — candidate RECONCILED, no re-research needed.** The brief's repo claims hold; its design conforms to every ratified boundary. Carrying **one correction** (already applied), **two hardening requirements**, and **one ledger upgrade**. Cleared to hand to Codex for build planning.

This is **not** a new web pass — Stage 1 already produced the brief, and re-running it would duplicate exactly what the chain was built to prevent. This step *reconciles* it.

---

## 2. Repo-truth reconciliation (my lane — file:line verified)

| Brief claim | Repo / ledger truth | Status |
|---|---|---|
| Screen owner / operator / charterer / vessel-by-IMO | `Owner` ([schema.prisma:132](../../prisma/schema.prisma#L132)), `Charterer` ([:143](../../prisma/schema.prisma#L143)), `Vessel.imo`+`mmsi` ([:244-245](../../prisma/schema.prisma#L244)); **no `Operator` entity** → correctly flagged net-new | ✅ Aligned |
| `Charterer` has `name` only | Also has `sector`, `contactName/Email/Phone`, `notes` ([:143-157](../../prisma/schema.prisma#L143)) | ⚠️ Understated, **not** mis-designed (still screened by name). **Already corrected** in `00-CONTEXT-BRIEF.md` + `STAGE-1-PROMPT.md` §5 |
| Gate the `ON_SUBS → FIXED` transition | The seam exists: `fixture-status-policy.ts` + `evaluateTransition`, wired into the status route and `advance-fixture-status.tool.ts`; it is "the only door to the DB" (ADR-0004) | ✅ Strongly aligned — the brief independently landed on the exact seam the ledger says to hook into |
| Mirror the existing `FixtureStatusChange` audit pattern for screening records | `FixtureStatusChange { fromStatus, toStatus, actor, notes, createdAt }` ([:367](../../prisma/schema.prisma#L367)) | ✅ Aligned — real analog for `ScreeningResult` / `ComplianceCase` |
| `FIXED` is the hard re-check gate | SPEC-001 §2: **`FIXED` == "clean fixed", no `CLEAN_FIXED` value** | ✅ Aligned — **but guard:** the brief's prose says "clean fixed" once. **Codex must NOT introduce a `CLEAN_FIXED` enum** (the superseded KB draft used it; Stage 0.1 §3 marks it obsolete) |
| Add `Vessel.flagState` (net-new) | Not present on `Vessel` ([:241-270](../../prisma/schema.prisma#L241)) | ✅ Additive |
| Copilot constrained to read-only explanation of stored screening evidence | Guardrail surface exists: `copilot-prompt.ts`, `approval-gated-write-tools.ts`, `build-copilot-tools.ts` | ✅ Aligned — conforms to ADR-0004/0005 |

---

## 3. Boundary-conformance checks (against the Stage 0.1 binding decisions)

| Boundary (ledger) | Brief's stance | Result |
|---|---|---|
| **AI boundary** (ADR-0004/0005): deterministic gate; copilot explains stored evidence only, refuses to conclude, never overrides; writes human-approved | Brief: "deterministic gate, copilot explains stored evidence only, refuses to conclude, no override"; BLOCK is a deterministic gate like `evaluateTransition` | ✅ Maps 1:1 — conforms, does not re-decide |
| **No legal advice / no autonomous compliance** (SPEC-001 §6) | Brief explicitly forbids both | ✅ Pass |
| **No reopening AIS / voice / RAG** | Brief explicitly scopes *out* behavioural AIS/dark-fleet ("Windward/Kpler territory"); no voice/RAG | ✅ Pass — stays in lane |
| **No `CLEAN_FIXED`** (SPEC-001 §2) | Brief uses "clean fixed" as prose, not an enum | ✅ Pass with the §2 guard above |

---

## 4. Corrections, hardening requirements, and ledger delta

**Correction (applied):**
1. `Charterer` field understatement — already fixed in the pack + prompt. No further action.

**Hardening requirements (promote brief's notes to hard build constraints):**
2. **Provenance on the denormalized `screeningStatus`.** The brief proposes a denormalized `screeningStatus` on Vessel/Owner/Operator/Charterer for dashboard speed. Under ADR-0002's "seeded ≠ live, provenance explicit" rule this **must** carry list-version/date provenance (`screenedAt` + `ttlExpiresAt`), not a bare enum — else the badge can present a **stale verdict as current**. Source of truth stays `ScreeningResult`; the denormalized field is a **cache**. The brief says this in its §7; **make it a hard requirement, not a note.**
3. **Zod at the list boundary.** The `yente`/OpenSanctions response is untrusted external data → **`z.schema.parse()` at the service boundary** (SPEC-001 §7-8). New entities (`Operator`, `ScreeningResult`, `ComplianceCase`, `Vessel.flagState`) migrate **additively**. The brief implies it; the repo standard mandates it.

**Ledger upgrade (optional → confirmed):**
4. **UK list migration.** Stage 0.1 §6 marked "check 2026 list migrations" *optional*. The brief answered it unprompted and it is **load-bearing**: the OFSI Consolidated List closed **28 Jan 2026** → the **FCDO UK Sanctions List** is now the single UK source. Anything keyed to the retired OFSI list is stale on day one. **Promote to a confirmed data-sourcing constraint.** *(Web-sourced — see §5; treat as the brief's `CONFIRMED` claim, verify at build.)*

---

## 5. Out-of-lane (web-fact axis — NOT repo-verifiable by Claude Code)

Per Principle 3, the following are **Claude.ai's lane**, not mine. I neither confirm nor refute them; I record their confidence labels and flag the few that gate the build:

- **Lists & access methods** (OFAC SLS, UK FCDO, EU FISMA, UN, OpenSanctions `yente` MIT/Docker, maritime/IMO export) — brief labels `CONFIRMED`; **build-gating** (data source choice). Verify access + licensing at build.
- **Licensing** (OpenSanctions free for non-commercial only; gov files open) — brief `CONFIRMED`; **build-gating**. Confirm before any productization claim.
- **Competitor screening features** (Sea/ Clearance Manager, Veson, PurpleTRAC, Kpler, MIRS, Windward, Signal Ocean/Shipfix "unclear") — brief `CONFIRMED`/`LIKELY`; informs framing, not the build.
- **The seed demo example** (OFAC 18-Dec-2024 OSV designations; specific IMOs) — brief `CONFIRMED` w/ Federal Register cite; verify the exact IMOs before seeding so the BLOCK demo is truthful (honesty rule, ADR-0002).

These do not change the verdict; they are the items Manu/Claude.ai own.

---

## 6. Hand-off to Codex (build-planning input — no estimates, Principle 5)

**Build first (narrow slice):** screen **Vessel-by-IMO → Owner → Operator → Charterer**; statuses `CLEAR / REVIEW / BLOCKED` (+ `STALE → REVIEW`); deterministic `screen()` service in the existing service layer; immutable `ScreeningResult` mirroring the `FixtureStatusChange` pattern; gate `ON_SUBS → FIXED` on `BLOCKED`/`STALE`; status badges + a screening panel on requirement/fixture; copilot read-only explanation of stored results with citations + explicit refusals.

**Net-new schema (additive):** `Operator`, `ScreeningResult`, `ComplianceCase`/`ScreeningReview`, `Vessel.flagState`; denormalized `screeningStatus` **as a provenance-carrying cache** (req. #2).

**Do NOT build yet:** beneficial-ownership/50%-rule graph traversal; ship-manager; port/cargo-counterparty; behavioural AIS/dark-fleet detection (out of scope); any voice/RAG path.

**Hard constraints carried from the ledger:** deterministic gate only (no model judgment on BLOCK); no `CLEAN_FIXED`; no legal advice; Zod at the list boundary; additive migrations; copilot conforms to ADR-0004/0005.

**Decisions that remain Manu's (joint, later):** data-source pick (`yente` self-host vs direct gov-file ingestion) + its licensing posture; the TTL/staleness duration; whether a true BLOCK is non-overridable in the demo; effort tiers.

---

## 7. Directional Verdict

**`RIGHT, BUT REFOCUS`.** The sanctions/operator-risk feature is the correct next build, the candidate brief is repo-reconciled and boundary-conformant, and the refocus is on **scope + provenance discipline** (IMO-first deterministic gate, sourced-explanation copilot, immutable provenance-carrying audit trail) — explicitly **not** behavioural AIS intelligence or autonomous compliance. **Concrete next move:** hand §6 to Codex for build planning; Manu resolves the §5 web-lane decisions and the joint calls before code. Effort tiers deferred and joint (Principle 5).
