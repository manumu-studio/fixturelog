<!-- Stage 2 build plan: converts reconciled sanctions/operator-risk research into a no-code implementation packet. No web; repo-grounded planning only. -->

# STAGE 2 BUILD PLAN — Sanctions / Operator-Risk Screening

**Run by:** Codex (in-project, no web) | **Date:** 2026-06-20
**Mode:** Planning only. No application-code edits, no broad code gates, no implementation.
**Primary input:** `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md`
**User decisions recorded:** 2026-06-20 14:42 CEST (`CONFIRMED-from-message`).
**Confidence labels:** `CONFIRMED`, `LIKELY`, `INFERENCE`, `UNVERIFIED`.

---

## 1. Executive Summary

- **CONFIRMED** — The next build should be the narrow sanctions/operator-risk slice, not another research pass: Stage 1 is reconciled, sanctions is the remaining product gap, and generic broker-dashboard/AIS/voice/RAG/UI-polish work is out of lane (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:13-17`, `:73-83`).
- **CONFIRMED** — FixtureLog already has the core repo seams the feature needs: `Owner`, `Charterer`, `Vessel`, `Requirement`, `Fixture`, `FixtureStatusChange`, broker dashboard, requirement detail, fixture status route, pure service layer, and copilot approval boundary (`prisma/schema.prisma:132-157`, `:241-349`, `:367-379`; `src/lib/services/fixture-status-policy.ts:48-112`; `src/app/api/fixtures/[id]/status/route.ts:48-87`).
- **CONFIRMED** — The first feature slice should screen `Vessel` by IMO, `Owner`, net-new `Operator`, and `Charterer`, then gate `ON_SUBS -> FIXED` when screening is `BLOCKED` or stale/unresolved (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-83`).
- **CONFIRMED** — The gate must stay deterministic. A language model may explain stored evidence but must not decide, clear, override, or give legal advice (`docs/research-V2/stage-0-pack/01-decisions/ADR-0004-copilot-human-in-the-loop.md:22-36`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:37-42`).
- **CONFIRMED** — The data model must be additive and provenance-carrying: source of truth is immutable `ScreeningResult`; denormalized party badges are caches with `screenedAt`, `ttlExpiresAt`, and list/source metadata (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:51-56`, `:75-77`).
- **CONFIRMED** — External list/yente/OpenSanctions responses must be parsed with Zod at the service boundary before any match decision is stored (`docs/research-V2/stage-0-pack/02-specs/SPEC-001-mvp-build.md:317-327`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52-53`).
- **CONFIRMED-from-message** — Manu resolved the three open implementation-policy decisions: use a local normalized fixture adapter first, set demo-critical screening freshness to 24 hours with mandatory pre-`FIXED` re-check, and make true `BLOCKED` matches non-overridable by brokers.

**Implementation readiness:** `READY TO IMPLEMENT` after the untracked research docs are committed/protected. No research blocker remains.

---

## 2. Source Inputs Read

| Source | What it contributed | Confidence / evidence note |
|---|---|---|
| `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` | Outcome/relevance discipline, no estimates, evidence/confidence rule | CONFIRMED (`:23-33`, `:84-111`, `:124-132`) |
| `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md` | Binding decisions, superseded material, unresolved questions, Stage 1 clearance | CONFIRMED (`:20-29`, `:37-46`, `:50-75`) |
| `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md` | Reconciled build input, hardening requirements, handoff to Codex | CONFIRMED (`:13-17`, `:21-31`, `:46-83`) |
| `docs/research-V2/STAGE-1-PROMPT.md` | Final Stage 1 constraints and entity context | CONFIRMED (`:1-13`, `:67-105`, `:107-168`) |
| `docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md` | Web-source recommendations, workflow map, seed example, risk statuses | CONFIRMED-as-candidate (`:15-28`, `:45-67`, `:85-103`, `:144-152`); web facts remain out-of-lane for Codex |
| `docs/continuation-prompts/CP-026-codex-build-planning.md` | Current active Matter B handoff and watch-outs | CONFIRMED (`:1-21`, `:23-45`) |
| `docs/incidents/INCIDENT-AI-confabulated-task-premise.md` | Evidence discipline and why reconstruction is forbidden | CONFIRMED (`:107-139`) |
| `prisma/schema.prisma` | Live data model and status enums | CONFIRMED (`:14-30`, `:132-157`, `:241-349`, `:367-379`) |
| Relevant live repo seams under `src/` | Transition policy, route handlers, dashboard/requirement UI, copilot boundary | CONFIRMED with file evidence in §3 |

---

## 3. Existing Repo Seams To Reuse

| Repo seam | File path | Current responsibility | How sanctions/operator-risk should hook in | Confidence |
|---|---|---|---|---|
| Prisma schema | `prisma/schema.prisma:14-30`, `:132-379` | Defines status enums, party entities, operational entities, fixture audit model | Additive migration only: add screening enums/entities/fields without changing existing status vocabulary | CONFIRMED |
| `Owner` | `prisma/schema.prisma:132-141` | Party entity with `name`, `country`, `notes`; owns vessels | Screen by `name`/`country`; add latest-screening cache fields; relate to `ScreeningResult` | CONFIRMED |
| `Charterer` | `prisma/schema.prisma:143-157` | Client/counterparty for requirements and fixtures, with sector/contact fields | Screen by `name` and optional `sector` context; add latest-screening cache fields; show badge on requirement/list/detail | CONFIRMED |
| `Vessel` | `prisma/schema.prisma:241-270` | Vessel identity/capability/open-position data; has unique `imo` and `mmsi` | Screen by IMO first; add `flagState`; add latest-screening cache fields and relation to results | CONFIRMED |
| `Requirement` | `prisma/schema.prisma:288-313` | Charterer demand/enquiry and linked fixtures | Screen charterer at creation; screen shortlist candidates when matching; expose requirement-level rollup | CONFIRMED |
| `Fixture` | `prisma/schema.prisma:315-352` | Negotiated deal linking vessel, charterer, broker, region, workscope, subjects, recaps, weather, status changes | Re-screen vessel/owner/operator/charterer on fixture creation and before `FIXED`; expose fixture-level rollup | CONFIRMED |
| `FixtureStatusChange` | `prisma/schema.prisma:367-379` | Immutable-ish audit row for status transitions with actor/timestamp | Mirror pattern for immutable `ScreeningResult` and broker review records | CONFIRMED |
| Fixture status policy | `src/lib/services/fixture-status-policy.ts:48-112` | Pure status-transition gate; subject-lift gate for `ON_SUBS -> FIXED` | Extend context or compose a sibling screening gate before persistence; keep deterministic and unit-tested | CONFIRMED |
| Status route | `src/app/api/fixtures/[id]/status/route.ts:48-87` | Validates transition, calls policy, persists fixture/status-change/requirement update in one transaction | Add pre-FIXED screening check before the transaction; reject with sourced reason when `BLOCKED` or stale/unresolved | CONFIRMED |
| Copilot status write executor | `src/lib/services/copilot/tools/advance-fixture-status.tool.ts:53-90` | Broker-scoped executor wraps the same status policy and transaction pattern | Must call the same screening-aware gate so copilot approval cannot bypass sanctions screening | CONFIRMED |
| Service layer pattern | `docs/research-V2/stage-0-pack/02-specs/SPEC-001-mvp-build.md:251-263`; `src/lib/services/fixture-matcher.ts:129-175` | Thin routes delegate to pure services; matcher is deterministic and no-I/O | Add `src/lib/services/sanctions-screening/` with pure classification plus I/O adapter boundary | CONFIRMED |
| Broker dashboard aggregate | `src/lib/services/portal/broker-queries.ts:71-100`; `src/app/(app)/dashboard/page.tsx:41-63` | Returns active enquiries, pending actions, timeline, copilot/voice panels | Include screening rollups/badges in active enquiries, timeline, and pending actions without broad dashboard redesign | CONFIRMED |
| Requirement list/detail | `src/app/(app)/requirements/page.tsx:7-65`; `src/app/(app)/requirements/[id]/page.tsx:34-63`; `ShortlistView.tsx:95-124` | Raw requirement table and shortlist detail with Zod-parsed API responses | Add screening column/badge and a screening panel; add shortlist-row badges for candidate vessels | CONFIRMED |
| Fixture list/detail API | `src/app/api/fixtures/route.ts:29-44`; `src/app/api/fixtures/[id]/route.ts:23-43` | Fixture list/detail APIs include vessel/charterer/status/relations | Include screening rollup/result data for fixture panels and copilot read tools | CONFIRMED |
| Broker close actions | `src/components/portal/FixtureCloseActions/FixtureCloseActions.tsx:19-90`; `useFixtureCloseActions.ts` not read | Renders status advancement buttons and inline API errors | Reuse the existing inline error path for `FIXED` gate rejection; add disabled/warn state only if UX requires | CONFIRMED for component; LIKELY for hook behavior |
| Copilot prompt | `src/lib/services/copilot/copilot-prompt.ts:19-51` | Answers only from current broker data/tools; fixed refusal phrase; write tools only proposed | Extend data summary/read tools with screening evidence; add sanctions-specific refusals and citation requirements | CONFIRMED |
| Copilot tool assembly | `src/lib/services/copilot/tools/build-copilot-tools.ts:16-22`; `approval-gated-write-tools.ts:20-30` | Read tools auto-run; write tools require approval | First slice should keep copilot read-only for screening explanations; any future screening write tool must be `needsApproval: true` | CONFIRMED |
| Broker auth boundary | `src/lib/auth/require-broker.ts:34-75` | Broker-only page/API guard; `brokerId` session-derived | Screening review/override actions must use session broker, never body-provided actor | CONFIRMED |

---

## 4. Smallest Credible Feature Slice

**First slice:** deterministic, provenance-carrying screening for `Vessel` by IMO, `Owner`, net-new `Operator`, and `Charterer`, surfaced as badges/panels and enforced at the `ON_SUBS -> FIXED` gate. **CONFIRMED** by the reconciled handoff (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-83`).

**Entities screened first**

| Subject | First-slice rule | Confidence / evidence |
|---|---|---|
| `Vessel` | Screen by IMO when available; fall back to name only as `REVIEW`, not `CLEAR`, when IMO is absent | CONFIRMED for IMO field (`prisma/schema.prisma:241-245`); INFERENCE for fallback policy |
| `Owner` | Screen by owner name/country and link result to vessels/fixtures | CONFIRMED for model (`prisma/schema.prisma:132-141`); CONFIRMED by cross-check (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:25`) |
| `Operator` | Add as distinct party because repo has no `Operator` and the brief/cross-check identifies it as net-new | CONFIRMED (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:25`, `:77`) |
| `Charterer` | Screen by charterer name, with sector/contact fields retained as context but not primary match keys | CONFIRMED (`prisma/schema.prisma:143-157`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:26`) |

**Data-source shape assumed**

- **CONFIRMED-from-message** — Start with a local normalized fixture adapter first: deterministic for the demo, no live-source fragility, and it preserves a clean seam for yente or direct government-file ingestion later.
- **CONFIRMED-as-brief / UNVERIFIED-by-Codex** — The reconciled brief proposes OpenSanctions/yente or direct government-list ingestion as the later source lane (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:85-103`, `:144-152`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:60-68`).
- **INFERENCE** — The implementation should hide the local adapter behind the same `ScreeningSource` interface that yente/direct-file ingestion can later implement without rewriting the status gate.
- **CONFIRMED** — Whatever source is chosen, external responses must be Zod-parsed before classification (`SPEC-001-mvp-build.md:321-327`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52-53`).

**Risk statuses**

| Display status | Stored decision | Meaning | Gate behavior | Confidence |
|---|---|---|---|---|
| `CLEAR` | `CLEAR` | No match above thresholds and result is fresh | Does not block | CONFIRMED by cross-check (`:75`) |
| `REVIEW` | `REVIEW` | Fuzzy/partial/ambiguous match, missing IMO fallback, source error needing broker review | Warns early; blocks `FIXED` while unresolved | CONFIRMED/INFERENCE (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-83`) |
| `BLOCKED` | `BLOCKED` | Exact/high-confidence designated match | Blocks `ON_SUBS -> FIXED`; broker override is not allowed | CONFIRMED (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-83`) + CONFIRMED-from-message |
| `STALE` | Derived from `ttlExpiresAt` | Latest result older than 24 hours for demo-critical screening freshness | Treat as `REVIEW` and block `FIXED` until refreshed; always re-check before `FIXED` | CONFIRMED hardening (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`) + CONFIRMED-from-message |

**Where the result appears**

- **CONFIRMED** — Broker dashboard active enquiries/timeline can show rollup badges because they already render active enquiries and fixture timeline (`src/app/(app)/dashboard/page.tsx:41-63`).
- **CONFIRMED** — `/requirements` list can show a screening-status column/badge (`src/app/(app)/requirements/page.tsx:39-64`).
- **CONFIRMED** — Requirement detail can show a screening panel above or alongside the shortlist (`src/app/(app)/requirements/[id]/ShortlistView.tsx:103-124`).
- **CONFIRMED** — Fixture timeline/close-action area can show a fixture screening badge and gate rejection (`FixtureTimeline.tsx:33-57`; `FixtureCloseActions.tsx:83-87`).
- **LIKELY** — A dedicated broker fixture-detail page was not read/verified; the API detail route exists and can carry screening data if/when such a page exists (`src/app/api/fixtures/[id]/route.ts:23-43`).

**Deliberately not included yet**

- Beneficial-ownership/50%-rule graph traversal, ship manager, port/country/cargo screening, behavioural AIS/dark-fleet detection, voice/RAG, legal advice, autonomous compliance decisions. **CONFIRMED** (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:79-83`).

---

## 5. Data / Model Plan

Conceptual only. No migration code.

### Existing model reuse

| Existing model/field | Reuse plan | Required now or later | Confidence / evidence |
|---|---|---|---|
| `Owner.id/name/country` | Screening subject; latest status cache target; relation target for `ScreeningResult` | Required now | CONFIRMED (`prisma/schema.prisma:132-141`) |
| `Charterer.id/name/sector/contact*` | Screening subject; latest status cache target; requirement/fixture rollup input | Required now | CONFIRMED (`prisma/schema.prisma:143-157`) |
| `Vessel.id/name/imo/mmsi/ownerId` | Primary vessel screening subject, with IMO as strongest key; owner linkage supplies owner screening | Required now | CONFIRMED (`prisma/schema.prisma:241-270`) |
| `Requirement.chartererId/status/fixtures` | Requirement rollup and early screening trigger | Required now | CONFIRMED (`prisma/schema.prisma:288-313`) |
| `Fixture.vesselId/chartererId/brokerId/status/statusChanges` | Fixture rollup, pre-FIXED gate, audit adjacency | Required now | CONFIRMED (`prisma/schema.prisma:315-352`) |
| `FixtureStatusChange` | Pattern to mirror for immutable screening history and actor/timestamp semantics | Required now as pattern, not reused as table | CONFIRMED (`prisma/schema.prisma:367-379`) |
| `Broker` / `AppUser` | Reviewer/actor source through session-derived broker context | Required when reviews are built | CONFIRMED (`prisma/schema.prisma:159-190`; `require-broker.ts:34-75`) |

### Net-new model candidates

| Proposed entity/field | Purpose | Relationship | Required now or later | Confidence / evidence |
|---|---|---|---|---|
| `Operator` | Distinct operator/disponent party separate from registered owner | Link from `Vessel` and/or `Fixture`; optional owner link | Required now | CONFIRMED net-new gap (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:25`, `:77`) |
| `ScreeningStatus` enum | Persist deterministic decision: `CLEAR`, `REVIEW`, `BLOCKED`; `STALE` derived from TTL | Used by result rows and cache fields | Required now | CONFIRMED statuses (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75`) + INFERENCE to derive stale |
| `ScreeningSubjectType` enum | Identifies `VESSEL`, `OWNER`, `OPERATOR`, `CHARTERER` | Stored on results/reviews for generic services | Required now | INFERENCE from required subject set |
| `ScreeningResult` | Immutable source of truth for each screen: query, subject, match status, source record, score, list metadata, timestamps, TTL | Relates to exactly one subject via typed nullable FKs or validated `subjectType + subjectId`; related to reviewer record | Required now | CONFIRMED (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-77`; candidate `:104-114`) |
| `ScreeningReview` | Broker review of `REVIEW` or exceptional `BLOCKED` results; stores reviewer, decision, rationale, timestamp | `ScreeningResult` -> review rows; reviewer broker relation | Required if REVIEW can be cleared before FIXED | CONFIRMED/INFERENCE (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:100-102`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:83`) |
| `ComplianceCase` | Multi-step case management over several results/subjects | Groups results/reviews by requirement/fixture | Later unless Manu wants richer workflow now | LIKELY from candidate (`:110`); INFERENCE to defer |
| `ScreeningSourceSnapshot` | Normalized list/source provenance: source name, jurisdiction, list version/date, fetchedAt, licence note | Referenced by `ScreeningResult` | Later if fields live on result for the local-adapter slice; recommended when yente/direct-file ingestion starts | INFERENCE from hardening requirement (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52-56`) + CONFIRMED-from-message source posture |
| `Vessel.flagState` | Supports flag risk and source-context display | Field on `Vessel` | Required now only if shown in first-slice panel; otherwise later | CONFIRMED additive gap (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:30`, `:77`) |
| `screeningStatus` cache fields on `Vessel`/`Owner`/`Operator`/`Charterer` | Fast dashboard badges | Cache only: status, latest result id, screenedAt, ttlExpiresAt, list/version metadata | Required now if badges appear on dashboard/list | CONFIRMED hard requirement (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`) |
| Match evidence fields | Store matched name, source record id/url, score, match type, list names checked, raw normalized payload hash | Fields on `ScreeningResult` | Required now | CONFIRMED audit/evidence requirement (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:65`, `:102`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-81`) |
| Reviewer/override fields | Record broker decision and rationale for `REVIEW`; for true `BLOCKED`, record reviewed/escalated/cannot-proceed only | `ScreeningReview` fields | Required now; broker override of true `BLOCKED` is not allowed | CONFIRMED-from-message |
| Timestamp/staleness fields | `screenedAt`, `ttlExpiresAt`, source/list update timestamp | Result + cache fields | Required now | CONFIRMED (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`) |

**Modeling recommendation:** Use typed nullable relations on `ScreeningResult` (`vesselId?`, `ownerId?`, `operatorId?`, `chartererId?`) plus `subjectType`, then enforce "exactly one subject" in the service/validator. **INFERENCE** — this gives better Prisma query ergonomics than a purely polymorphic `subjectId`, while still letting one service classify all subjects.

---

## 6. Deterministic Service-Layer Plan

**Service placement:** `src/lib/services/sanctions-screening/`. **INFERENCE** from service-layer convention (`SPEC-001-mvp-build.md:251-263`) and pure-service precedent (`fixture-matcher.ts:129-175`).

**Input**

- `subject`: one of vessel/owner/operator/charterer with stable id and identifiers. **CONFIRMED** subject set (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75`).
- `source`: a local normalized fixture adapter implementing the same `ScreeningSource` interface that yente/direct-gov adapters can later implement. **CONFIRMED-from-message** for local-first posture; **INFERENCE** for interface shape.
- `clock`: injected current time for TTL tests. **INFERENCE** from deterministic-test needs.
- `thresholds`: exact/block and review thresholds. **INFERENCE** — for the local adapter, make the seeded fixture exact-match deterministic; keep thresholds explicit config for later yente/direct-file ingestion.

**Output**

- `status`: `CLEAR | REVIEW | BLOCKED`.
- `freshness`: `FRESH | STALE` derived from `ttlExpiresAt`.
- `matchedRecords`: normalized source refs with list name/version/date, source id/url, score, match reason.
- `decisionReason`: short deterministic reason fit for UI/copilot.
- `auditPayload`: exact query, source response metadata, screenedAt, ttlExpiresAt.

**Deterministic match logic**

- **CONFIRMED** — Vessel IMO exact match is the primary high-confidence path because `Vessel.imo` exists and Stage 1 prioritizes vessel-by-IMO (`prisma/schema.prisma:241-245`; candidate `:87-93`).
- **INFERENCE** — Exact source-designated IMO or exact entity identifier -> `BLOCKED`.
- **INFERENCE** — Name-only or fuzzy subject match above review threshold -> `REVIEW`, not `BLOCKED`, unless the source returns an explicit high-confidence designation.
- **CONFIRMED** — Missing or stale results must not silently display as clear; stale becomes review/blocking at `FIXED`, with 24 hours as the demo TTL and a mandatory re-check before `FIXED` (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`, `:75`; CONFIRMED-from-message).

**Failure modes**

| Failure | Deterministic response | Confidence / evidence |
|---|---|---|
| Source unavailable | Persist or surface `REVIEW`/source-error state; do not mark `CLEAR` | INFERENCE from no-stale-verdict rule |
| Response fails Zod parse | Reject as boundary error; no screening result or a `REVIEW` technical-failure result, depending on route context | CONFIRMED Zod rule (`SPEC-001-mvp-build.md:321-327`) |
| Subject lacks IMO | Use name-based screening and classify no-hit as `REVIEW` until broker accepts; do not overstate `CLEAR` for vessel identity | INFERENCE; conservative under evidence discipline |
| Existing result expired | Derive `STALE` after 24 hours and require refresh before `FIXED` | CONFIRMED (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`) + CONFIRMED-from-message |
| Ambiguous/fuzzy matches | `REVIEW` with matched records and broker rationale required | CONFIRMED/INFERENCE (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:61-65`) |

**Testable boundaries**

- Pure classifier: no Prisma, no fetch, no time globals.
- Source adapter: Zod parse of yente/OpenSanctions/direct-file response.
- Persistence coordinator: writes immutable `ScreeningResult` and updates cache fields in one transaction.
- Gate evaluator: maps latest screening rollup to allow/block reason for `FIXED`.

---

## 7. Workflow / Status-Gate Plan

```text
Requirement ENQUIRY
  -> SHORTLISTED
  -> NEGOTIATING
  -> ON_SUBS
  -> FIXED
  -> LOST

Fixture DRAFT
  -> NEGOTIATING
  -> ON_SUBS
  -> FIXED
  -> COMPLETED / FAILED
```

| Workflow point | Screening behavior | Confidence / evidence |
|---|---|---|
| Requirement `ENQUIRY` creation | Screen charterer immediately; show `Not screened` only while trigger is pending | CONFIRMED creation starts as `ENQUIRY` (`src/app/api/requirements/route.ts:40-60`); INFERENCE trigger |
| Requirement matching / `SHORTLISTED` | Screen shortlist vessel IMO + owner + operator for returned candidates; surface row badges | CONFIRMED match promotes `ENQUIRY -> SHORTLISTED` (`src/app/api/requirements/[id]/match/route.ts:153-166`); CONFIRMED candidate workflow (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:51-55`) |
| Fixture creation | Screen final fixture parties again: vessel, owner, operator, charterer | CONFIRMED fixture create path (`src/app/api/fixtures/route.ts:85-119`); INFERENCE trigger |
| Fixture `NEGOTIATING` | Re-screen only on party/vessel substitution or manual broker action | INFERENCE from material-change rule (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:52-55`) |
| Fixture `ON_SUBS` | Require screening panel to show current party statuses; unresolved `REVIEW` stays visible | CONFIRMED `ON_SUBS` is pre-binding (`SPEC-001-mvp-build.md:40-59`) |
| Fixture `ON_SUBS -> FIXED` | Mandatory re-check; block on true `BLOCKED`, stale, source failure, or unresolved review | CONFIRMED seam (`fixture-status-policy.ts:75-103`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75`) + CONFIRMED-from-message |
| Requirement `FIXED` | Propagates only after linked fixture reaches `FIXED`; screening gate therefore protects requirement fixed status through fixture policy | CONFIRMED (`SPEC-001-mvp-build.md:61-80`; `fixture-status-policy.ts:97-103`) |

**Broker review / override**

- `REVIEW` requires a named broker rationale before `FIXED`. **INFERENCE** from candidate review requirement (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:100-102`) and broker context (`require-broker.ts:34-75`).
- True `BLOCKED` is non-overridable by brokers in the demo. The allowed actions are "mark reviewed", "escalate", and "cannot proceed"; none clear the gate. **CONFIRMED-from-message**.
- All review actions must store actor from session, never from request body. **CONFIRMED pattern** (`require-broker.ts:50-75`; `fixtures/route.ts:51-53`).

**Audit evidence stored**

- Immutable `ScreeningResult`: subject, exact query, lists checked, list version/date, score, source ref/url, status, screenedAt, ttlExpiresAt. **CONFIRMED** (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:65`, `:102`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`).
- `ScreeningReview`: reviewer broker, rationale, reviewedAt, outcome, linked result. **INFERENCE** from review workflow.
- Existing `FixtureStatusChange` remains the status-transition audit trail; do not overload it with screening details. **CONFIRMED pattern** (`prisma/schema.prisma:367-379`).

---

## 8. UI Placement Plan

No visual design beyond placement and states.

| Surface | Placement | States | Confidence / evidence |
|---|---|---|---|
| Broker dashboard | Add compact screening rollup badge to `ActiveEnquiries` and `FixtureTimeline`; add pending action when review is required | `CLEAR`, `REVIEW`, `BLOCKED`, `STALE`, `NOT_SCREENED`, source error | CONFIRMED dashboard composition (`dashboard/page.tsx:41-63`; `broker-queries.ts:95-100`) |
| `/requirements` list | Add a screening column/badge near status; keep table shape, no UI-polish rewrite | Same as above; badge links to detail | CONFIRMED current table (`requirements/page.tsx:39-64`) |
| Requirement detail | Add `ScreeningPanel` before shortlist; add shortlist row badges for vessel/owner/operator results | Empty: "Not screened"; loading: "Checking"; error: "Review required"; stale: "Re-screen required" | CONFIRMED detail and shortlist surfaces (`ShortlistView.tsx:103-124`) |
| Fixture timeline | Add fixture-level rollup badge near existing status; gate errors appear in existing close-action error area | Existing inline error can show screening block reason | CONFIRMED (`FixtureTimeline.tsx:33-57`; `FixtureCloseActions.tsx:83-87`) |
| Fixture detail/API-backed view | Include screening panel near status/subjects if/when broker detail view exists; API should include result data | Same as requirement panel | CONFIRMED API detail seam (`src/app/api/fixtures/[id]/route.ts:23-43`); UI page not verified |
| Copilot panel | No new visible widget required; copilot answers from stored screening evidence | Must cite source record/list/version; refuses legal conclusions | CONFIRMED prompt boundary (`copilot-prompt.ts:19-51`) |

**Review/action states**

- `REVIEW`: show "Needs broker review" action, with evidence list and rationale field in implementation.
- `BLOCKED`: show deterministic block reason, source citation, and "Reviewed / Escalate / Cannot proceed" actions only; no broker override or "fix deal" path.
- `STALE`: show TTL expiry and "Re-screen" action.
- `SOURCE_ERROR`: show "Screening unavailable - review required"; do not mark clear.

---

## 9. Copilot Boundary Plan

**What the copilot may say**

- It may summarize stored screening status for a requirement/fixture/party. **CONFIRMED** current prompt allows only current desk data (`copilot-prompt.ts:23-33`).
- It may explain why a result is `REVIEW` or `BLOCKED` using stored `ScreeningResult` evidence: list name, version/date, source record, match score, and timestamp. **CONFIRMED** by Stage 1 boundary (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-81`).
- It may say a result is stale and point the broker to a re-screen/review action. **CONFIRMED** staleness hardening (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`).

**What it must refuse**

- Legal conclusions such as "this is legal," "we can trade," or "the sanction definitely applies." **CONFIRMED** no legal advice boundary (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:40`).
- Any sanctions status not present in stored evidence. **CONFIRMED** current "only from current data" rule (`copilot-prompt.ts:23-33`).
- Clearing or overriding a true `BLOCKED` result. **CONFIRMED** deterministic gate boundary (`docs/research-V2/stage-0-pack/01-decisions/ADR-0004-copilot-human-in-the-loop.md:22-36`) + CONFIRMED-from-message.
- Beneficial-ownership/50%-rule determinations. **CONFIRMED out of first slice** (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:79`).

**Evidence it must cite**

- `ScreeningResult` id/status, subject, list/source name, list version/date, source record id/url, screenedAt, ttlExpiresAt, reviewer decision if applicable. **INFERENCE** from audit requirements (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:65`, `:102`).

**Actions requiring approval**

- First slice: no copilot write action for screening is required. **INFERENCE** to keep slice narrow.
- Any future copilot tool that triggers a re-screen, review decision, override, or status transition must be approval-gated with `needsApproval: true`. **CONFIRMED** write-gate pattern (`approval-gated-write-tools.ts:20-30`; `build-copilot-tools.ts:16-22`).

**What remains deterministic**

- Source parsing, match scoring, status classification, TTL/staleness, review gating, `FIXED` transition rejection. **CONFIRMED** by cross-check (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:37-42`, `:75-81`).

**Hallucination prevention**

- Extend `buildBrokerDataSummary()` or `getFixture` result schemas to include screening evidence; do not let the model call external sanctions sources directly. **INFERENCE** from current grounded prompt/tool architecture (`broker/copilot/route.ts:99-119`; `copilot-tools.types.ts:28-39`).
- Add sanctions-specific prompt rules adjacent to the existing "only from data" and "never invent" rules. **CONFIRMED current rule location** (`copilot-prompt.ts:19-51`).

---

## 10. Testing Strategy

Do not run tests now. This is the scoped test plan for implementation.

| Test layer | What to test | Candidate files | Confidence / evidence |
|---|---|---|---|
| Unit: classifier | Local normalized exact fixture match -> `BLOCKED`; no hit -> `CLEAR`; fuzzy/name-only -> `REVIEW`; result older than 24h -> derived `STALE` | New `src/lib/services/sanctions-screening/*.test.ts` | INFERENCE from service plan + CONFIRMED-from-message |
| Unit: source parser | yente/OpenSanctions/direct-source response Zod parsing rejects malformed payloads and normalizes valid matches | New parser tests beside service | CONFIRMED Zod boundary (`SPEC-001-mvp-build.md:321-327`) |
| Unit: gate | `ON_SUBS -> FIXED` rejects `BLOCKED`, stale, unresolved review; allows fresh clear + lifted/waived subjects | Extend or add beside `fixture-status-policy.test.ts` | CONFIRMED existing gate (`fixture-status-policy.ts:75-103`) |
| API/service integration | Requirement create screens charterer; match screens shortlist subjects; fixture create screens fixture parties; status route blocks `FIXED` | Route/service tests under existing API test pattern | CONFIRMED route seams (`requirements/route.ts:11-60`; `requirements/[id]/match/route.ts:93-181`; `fixtures/route.ts:47-119`; `fixtures/[id]/status/route.ts:9-87`) |
| Persistence | `ScreeningResult` immutable rows are created; cache fields update with provenance; review rows carry session broker | New model/service tests | CONFIRMED audit/cache requirements (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:52`, `:75-77`) |
| UI | Badges render on dashboard/list/detail; stale/source-error states visible; FIXED gate error appears inline | Existing page/component test style, add focused tests | CONFIRMED surfaces (`dashboard/page.tsx:41-63`; `requirements/page.tsx:39-64`; `FixtureCloseActions.tsx:83-87`) |
| Copilot boundary | Copilot summarizes stored evidence; refuses legal conclusions; cannot clear/override; approved status write still blocked by policy | Add to existing copilot tests | CONFIRMED tests/guardrail pattern (`docs/research-V2/stage-0-pack/01-decisions/ADR-0004-copilot-human-in-the-loop.md:48-56`; `copilot-tools.types.ts:69-82`) |
| Seed/demo fixture | Seed one verified OSV/operator example only after source/IMO verification; assert `BLOCKED` demo path works | Seed tests/e2e later | CONFIRMED-as-brief, verify-at-build (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:146-152`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:67`) |

**Mocks/fixtures needed**

- Normalized yente/OpenSanctions response fixture with exact IMO hit.
- Fuzzy-name response fixture for `REVIEW`.
- Empty response fixture for `CLEAR`.
- Malformed response fixture for Zod rejection.
- Expired `ScreeningResult` fixture for stale gate.

---

## 11. Risks / Decisions Recorded

| Decision | Options | Final decision | Consequence | Confidence |
|---|---|---|---|---|
| Data-source posture | (A) self-host OpenSanctions/yente for demo; (B) direct government-file ingestion; (C) local normalized fixture data first, adapter later | **C: local normalized fixture adapter first**, with a clean seam for yente/direct gov ingestion later | Safest for demo, deterministic, avoids live-source fragility; later external adapters still fit the same boundary | CONFIRMED-from-message |
| TTL/staleness duration | Short fixed TTL; event-only re-screen; configurable per source | **24 hours** for demo-critical screening freshness, with mandatory re-check before `FIXED` | Simple, conservative, easy to explain; keeps stale clearances out of the hard gate | CONFIRMED-from-message |
| True `BLOCKED` override policy | Non-overridable in demo; compliance-role override; broker override with rationale | **No broker override for true `BLOCKED`**; allow only mark reviewed / escalate / cannot proceed | Keeps compliance boundary clean and avoids implying sanctions can be bypassed | CONFIRMED-from-message |
| `ScreeningReview` vs full `ComplianceCase` in first slice | Minimal review row now; full case entity now; full case later | Minimal `ScreeningReview` now, full `ComplianceCase` later | Keeps scope narrow while still making `REVIEW` auditable | INFERENCE from candidate/cross-check |
| Seed BLOCK example | Use ARTEMIS OFFSHORE / UMKA after verifying exact source records; use a synthetic obvious demo row; no BLOCK seed | Use real citable example only after build-time verification | Real example lands better; unverified seed would violate honesty rule | CONFIRMED-as-brief, verify-at-build (`docs/research-V2/stage-1-candidate-reports/2026-06-20-compass-sanctions-operator-risk-research.md:146-152`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:67`) |

---

## 12. Implementation Readiness Verdict

```text
READY TO IMPLEMENT
```

**Exact next action:** Protect the untracked research docs in git, then create the implementation task packet from this Stage 2 plan. The packet should build the local-adapter first slice:

1. additive models/enums for `Operator`, `ScreeningResult`, `ScreeningReview`, `Vessel.flagState`, provenance-carrying cache fields;
2. local normalized screening source adapter + Zod-normalized response shape;
3. deterministic `screen()` service and 24-hour staleness rule;
4. mandatory pre-`FIXED` re-check and non-overridable true-`BLOCKED` gate;
5. scoped badges/panels and copilot read-only explanation from stored evidence.

No code gates were run for this planning pass.
