<!-- Stage 3 implementation packet: no app-code edits. Converts Stage 2 into the narrow build handoff for the sanctions/operator-risk slice. -->

# STAGE 3 IMPLEMENTATION PACKET — Sanctions / Operator-Risk

## 1. Implementation Goal

Build a deterministic, provenance-carrying sanctions/operator-risk screening slice that screens vessel, owner, operator, and charterer risk, then blocks `ON_SUBS -> FIXED` when the latest evidence is true `BLOCKED`, stale, source-failed, or unresolved.

## 2. Settled Decisions

| Decision | Final choice | Evidence path | Why it matters |
|---|---|---|---|
| Data-source posture | Start with a local normalized fixture adapter first; do not start with yente or direct government-file ingestion | `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:83`; `docs/continuation-prompts/CP-026-codex-build-planning.md:18` | Keeps the demo deterministic and preserves an adapter seam for later live sources. |
| TTL / staleness | Results are valid for 24 hours | `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:95`; `docs/continuation-prompts/CP-026-codex-build-planning.md:42` | Prevents stale clearance badges from looking current. |
| Mandatory pre-`FIXED` re-check | Always re-check before `FIXED`; stale results block until refreshed | `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:172`; `:217` | Makes the hard gate honest at the commercial commitment point. |
| True `BLOCKED` override | Broker cannot override a true `BLOCKED`; allowed states are mark reviewed, escalate, or cannot proceed | `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:223`; `:322` | Avoids presenting the app as a sanctions-bypass tool. |
| Deterministic screening | Source parsing, matching, status classification, TTL, and gate rejection are service decisions, not model decisions | `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:37-42`; `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:18` | Lets tests prove the compliance gate without relying on language-model judgment. |
| Sourced explanations | UI and copilot explanations cite stored `ScreeningResult` evidence: source/list, version/date, match reason, and timestamps | `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:75-81`; `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:260-275` | Keeps every warning explainable and auditable. |
| Human review | `REVIEW` requires broker review/rationale before `FIXED`; actor comes from session, never request body | `src/lib/auth/require-broker.ts:50-75`; `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:220-225` | Preserves the human-in-the-loop boundary. |
| No legal advice | The feature must not say a trade is legal or illegal; it reports deterministic matches and review state only | `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md:69`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:40` | Keeps the demo inside the ratified MVP boundary. |
| No autonomous compliance decisions | The app blocks or asks for review based on deterministic evidence; it does not clear legal/compliance liability | `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md:69`; `docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:265-275` | Prevents model or broker bypass of a true sanctions block. |
| No model training | No training/fine-tuning; copilot only summarizes stored evidence from current broker data | `src/lib/services/copilot/copilot-prompt.ts:23-51`; `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md:65` | Keeps AI behavior grounded in current data and the ratified copilot boundary. |
| No `CLEAN_FIXED` enum | `FIXED` is the clean-fixed state; do not add `CLEAN_FIXED` | `prisma/schema.prisma:14-29`; `docs/research-V2/STAGE-0.1-OUTPUT-decision-coverage.md:64` | Avoids reviving superseded status vocabulary. |

## 3. Implementation Scope

### Build Now

- Add additive screening data structures for `Operator`, `ScreeningResult`, minimal `ScreeningReview`, `Vessel.flagState`, and provenance-carrying latest-status cache fields.
- Add a local normalized sanctions fixture adapter behind a `ScreeningSource` service boundary.
- Add deterministic `screen()` and rollup/gate services for vessel-by-IMO, owner, operator, and charterer.
- Integrate mandatory pre-`FIXED` screening into the existing fixture status transition path.
- Surface compact screening badges/panels in existing broker dashboard, requirement detail/list, fixture timeline/action surfaces, and copilot evidence summaries.
- Add scoped tests for model behavior, classifier logic, stale detection, status gate blocking, UI states, and copilot refusal/evidence rules.

### Explicitly Not Now

- No AIS, dark-fleet behavior, or live vessel movement screening.
- No yente deployment and no live government-file ingestion.
- No beneficial-ownership / 50 percent ownership graph traversal.
- No ship-manager, cargo, port, or country-risk expansion.
- No voice/RAG work.
- No generic `/requirements` or `/charterers` UI polish.
- No interview logistics or generic broker-dashboard research.
- No legal advice, autonomous compliance clearing, or broker bypass for true `BLOCKED`.

## 4. Files Likely To Change

| File path | Change type | Reason | Risk level |
|---|---|---|---|
| `prisma/schema.prisma` | Modify | Add `Operator`, screening enums, `ScreeningResult`, `ScreeningReview`, `Vessel.flagState`, and latest-screening cache fields | High |
| `prisma/migrations/*` | Create | Additive database migration for screening structures | High |
| `prisma/seed.ts` | Modify | Seed local normalized sanctions fixture and at least one demo screenable subject | Medium |
| `src/lib/services/sanctions-screening/` | Create | Pure classifier, source adapter, TTL/freshness, rollup, and persistence coordinator | High |
| `src/lib/services/fixture-status-policy.ts` | Modify or wrap | Compose screening gate with the existing `ON_SUBS -> FIXED` subject gate | High |
| `src/app/api/fixtures/[id]/status/route.ts` | Modify | Run screening-aware gate before status persistence | High |
| `src/lib/services/copilot/tools/advance-fixture-status.tool.ts` | Modify | Ensure copilot-approved status writes cannot bypass the same screening-aware gate | High |
| `src/app/api/requirements/route.ts` | Modify | Trigger charterer screening when a requirement is created | Medium |
| `src/app/api/requirements/[id]/match/route.ts` | Modify | Screen shortlist candidates by vessel/owner/operator when matching | Medium |
| `src/app/api/fixtures/route.ts` | Modify | Screen fixture parties when a fixture is created | Medium |
| `src/app/api/fixtures/[id]/route.ts` | Modify | Include screening evidence for fixture detail/copot read tools | Low |
| `src/lib/services/portal/broker-queries.ts` | Modify | Add screening rollups and pending review actions to the broker dashboard aggregate | Medium |
| `src/lib/validators/portal.validators.ts` | Modify | Add Zod-validated screening badge/panel shapes to dashboard data | Medium |
| `src/app/(app)/requirements/page.tsx` | Modify | Add screening column/badge to the existing table | Low |
| `src/app/(app)/requirements/[id]/page.tsx` | Modify | Fetch and pass screening data to the requirement detail surface | Low |
| `src/app/(app)/requirements/[id]/ShortlistView.tsx` | Modify | Show requirement and shortlist screening states | Low |
| `src/components/portal/FixtureTimeline/FixtureTimeline.tsx` | Modify | Show fixture screening rollup near status/weather | Low |
| `src/components/portal/FixtureCloseActions/FixtureCloseActions.tsx` | Modify | Show screening block/stale errors and disable unsafe `FIXED` path if data already says blocked | Medium |
| `src/lib/services/copilot/broker-data-summary.ts` | Modify | Include stored screening evidence in the copilot grounding block | Medium |
| `src/lib/services/copilot/copilot-prompt.ts` | Modify | Add sanctions-specific refusal and citation rules | Medium |
| `src/lib/services/copilot/tools/get-fixture.tool.ts` | Modify | Return screening evidence for fixture-specific copilot answers | Medium |
| `src/lib/services/sanctions-screening/*.test.ts` | Create | Classifier, source parser, stale, persistence, and gate test coverage | Medium |
| `src/lib/services/fixture-status-policy.test.ts` | Modify | Add `ON_SUBS -> FIXED` screening gate cases | Medium |
| `src/app/api/fixtures/[id]/status/route.test.ts` | Modify | Assert API rejects blocked/stale/unresolved review before persisting | Medium |
| `src/lib/services/copilot/tools/advance-fixture-status.tool.test.ts` | Modify | Assert approved copilot writes still respect screening gate | Medium |

## 5. Data Model Implementation Plan

- Add `Operator` as a distinct party, because the live repo has `Owner`, `Charterer`, and `Vessel`, but no `Operator` (`prisma/schema.prisma:132-157`; `:241-270`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:25`).
- Add `Vessel.flagState` as an additive optional field. It supports visible risk context without changing existing vessel identity fields (`prisma/schema.prisma:241-270`; `docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:30`).
- Add `ScreeningStatus` for stored determinations: `CLEAR`, `REVIEW`, `BLOCKED`. Treat `STALE` as derived from `ttlExpiresAt`, not as the source-of-truth result.
- Add `ScreeningSubjectType`: `VESSEL`, `OWNER`, `OPERATOR`, `CHARTERER`.
- Add `ScreeningResult` as the source-of-truth audit record:
  - subject type and one typed subject relation;
  - optional `fixtureId` and/or `requirementId` context;
  - query used for screening;
  - source name, source jurisdiction, source list name, source list version/date, source record id/url;
  - matched name/identifier, match type, score/confidence, deterministic reason;
  - `status`, `screenedAt`, `ttlExpiresAt`, and raw normalized evidence JSON.
- Enforce "exactly one subject" in the service validator if Prisma cannot express that constraint cleanly across nullable typed relations.
- Add latest-screening cache fields to `Vessel`, `Owner`, `Operator`, and `Charterer`: latest status, latest result id, `screenedAt`, `ttlExpiresAt`, source/list/version metadata. These are cache fields only; `ScreeningResult` remains authoritative (`docs/research-V2/STAGE-1-CROSSCHECK-compass-sanctions.md:51-56`).
- Add `ScreeningReview` as the minimal review/audit record:
  - linked `ScreeningResult`;
  - broker reviewer from session-derived `brokerId`;
  - review action: reviewed, escalated, cannot proceed, or review-cleared for non-`BLOCKED` `REVIEW` cases;
  - rationale, `createdAt`, and optional notes.
- Do not add full `ComplianceCase` in the first slice unless implementation reveals that `ScreeningReview` cannot represent the required review workflow. Stage 2 recommends minimal review now and full case later (`docs/research-V2/STAGE-2-BUILD-PLAN-sanctions-operator-risk.md:323`).
- Relationship targets:
  - `Vessel`: screened by IMO first, name fallback as review-only when identity is weak.
  - `Owner`: screened by name/country and rolls into vessel/fixture risk.
  - `Operator`: screened as distinct operational counterparty.
  - `Charterer`: screened by name, with sector/contact fields retained as context.
  - `Requirement`: receives charterer screening and shortlist screening rollup.
  - `Fixture`: receives final party screening rollup and hard gate evidence.

## 6. Service Implementation Plan

- Create `src/lib/services/sanctions-screening/` and keep pure logic separate from Prisma I/O, matching the existing service-layer pattern (`docs/research-V2/stage-0-pack/02-specs/SPEC-001-mvp-build.md:251-263`; `src/lib/services/fixture-status-policy.ts:48-112`).
- Normalize screenable subjects:
  - vessel: id, name, IMO, MMSI, owner, operator, flag state;
  - owner/operator/charterer: id, name, country/sector where available.
- Load local normalized sanctions fixture data through an adapter shaped like a future `ScreeningSource`.
- Zod-parse the local adapter output even though it is local, so the later yente/direct-gov adapter uses the same validation boundary.
- Match by strongest identifiers first:
  - vessel IMO exact match can produce `BLOCKED`;
  - exact designated party identifier/name can produce `BLOCKED` only when the local fixture marks it as a true block;
  - fuzzy/name-only or missing-IMO matches produce `REVIEW`;
  - no hit with adequate identifiers produces `CLEAR`.
- Classify freshness:
  - `screenedAt + 24 hours = ttlExpiresAt`;
  - result older than `ttlExpiresAt` is derived `STALE`;
  - stale never silently displays as clear.
- Return evidence every time:
  - status, freshness, subject, matched records, source/list metadata, deterministic reason, timestamps.
- Fail safely:
  - source unavailable, parse failure, missing critical identity, or ambiguous records become `REVIEW` or source-error blocking state, not `CLEAR`.
- Persist immutable `ScreeningResult` rows and update cache fields in one transaction when possible.
- Provide rollup functions:
  - requirement rollup: charterer + shortlist candidate statuses;
  - fixture rollup: vessel + owner + operator + charterer statuses;
  - gate rollup: allow, warn, review-required, stale-required, blocked.

## 7. Workflow / Gate Implementation Plan

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

- Requirement `ENQUIRY`: screen the charterer when the requirement is created in `src/app/api/requirements/route.ts:40-60`.
- Requirement `SHORTLISTED`: when matching runs in `src/app/api/requirements/[id]/match/route.ts:138-180`, screen returned shortlist candidates by vessel, owner, and operator.
- Requirement `NEGOTIATING` / `ON_SUBS`: re-screen when shortlisted vessel, owner, operator, or charterer materially changes.
- Fixture `DRAFT`: when fixture creation persists in `src/app/api/fixtures/route.ts:85-119`, screen the chosen vessel, owner, operator, and charterer.
- Fixture `NEGOTIATING`: warn on `REVIEW`, `BLOCKED`, `STALE`, or source error; do not block non-`FIXED` progress unless implementation discovers a hard reason.
- Fixture `ON_SUBS`: display the current screening rollup next to subjects and close actions.
- Fixture `ON_SUBS -> FIXED`: mandatory re-check immediately before persistence. Block if any included party is true `BLOCKED`, stale after 24 hours, source-failed, or unresolved `REVIEW`.
- Existing status policy already owns the subject-lift gate for `ON_SUBS -> FIXED` (`src/lib/services/fixture-status-policy.ts:75-103`). Compose screening with that gate instead of replacing it.
- The API route must reject before transaction persistence if the screening gate fails (`src/app/api/fixtures/[id]/status/route.ts:48-87`).
- The copilot status executor must use the same screening-aware gate so approval cannot bypass it (`src/lib/services/copilot/tools/advance-fixture-status.tool.ts:53-90`).
- Store screening audit evidence in `ScreeningResult`/`ScreeningReview`; keep `FixtureStatusChange` for status transitions only (`prisma/schema.prisma:367-379`).

## 8. UI Implementation Plan

- Broker dashboard:
  - add compact screening rollup badges to active enquiries and fixture timeline data from `getBrokerDashboard()` (`src/lib/services/portal/broker-queries.ts:71-100`; `src/app/(app)/dashboard/page.tsx:41-63`);
  - add pending action text for screening review/escalation when required.
- Requirement list:
  - add a `Screening` column near `Status` in the current table (`src/app/(app)/requirements/page.tsx:39-64`);
  - keep the raw table shape and avoid broader UI polish.
- Requirement detail:
  - add a small `ScreeningPanel` before shortlist output (`src/app/(app)/requirements/[id]/page.tsx:56-63`);
  - add candidate-level badges in `ShortlistView` rows (`src/app/(app)/requirements/[id]/ShortlistView.tsx:66-124`).
- Fixture timeline:
  - show fixture rollup near the existing `StatusBadge` and weather line (`src/components/portal/FixtureTimeline/FixtureTimeline.tsx:33-57`).
- Fixture close actions:
  - show stale/source-error/review/blocking reason in the existing inline alert path (`src/components/portal/FixtureCloseActions/FixtureCloseActions.tsx:83-87`);
  - disable or warn on "Fix the deal" when cached evidence already says the next click will block, but still let the API be authoritative.
- Badges/statuses:
  - `CLEAR`: green/neutral short badge with `screenedAt`;
  - `REVIEW`: warning badge and review action;
  - `BLOCKED`: blocking badge with evidence/citation and no broker bypass;
  - `STALE`: warning badge with re-screen action;
  - `NOT_SCREENED`: neutral badge;
  - `SOURCE_ERROR`: warning/blocking state.
- Empty/loading/error:
  - empty: "Not screened";
  - loading: "Checking";
  - stale: "Re-screen required";
  - source error: "Screening unavailable - review required";
  - true block: "Blocked by screening result" plus evidence.
- Keep visual work minimal and use existing portal/card/status patterns where practical.

## 9. Copilot Implementation Boundary

- Allowed answers:
  - summarize stored screening status for a requirement, fixture, vessel, owner, operator, or charterer;
  - explain why an item is `REVIEW`, `BLOCKED`, `STALE`, or clear using stored evidence;
  - point to the needed human action: review, re-screen, escalate, cannot proceed.
- Required citations/evidence:
  - `ScreeningResult` id/status;
  - subject type/name/identifier;
  - source/list name, version/date, record id/url if present;
  - matched identifier/name, score or deterministic match reason;
  - `screenedAt`, `ttlExpiresAt`, and reviewer action if any.
- Refusal cases:
  - legal conclusions such as "this trade is legal" or "we can proceed";
  - any sanctions status not present in current broker data or tool results;
  - clearing or overriding true `BLOCKED`;
  - beneficial-ownership/50-percent-rule conclusions;
  - external sanctions lookups by the model.
- Human-approval cases:
  - future re-screen/review tools require `needsApproval: true` if they write data;
  - first slice can keep the copilot read-only for screening explanations.
- Deterministic boundaries:
  - source parsing, matching, classification, TTL/staleness, gate rejection, and review state are service outputs, not language-model outputs.
- Integration points:
  - include screening evidence in `buildBrokerDataSummary()` (`src/lib/services/copilot/broker-data-summary.ts:54-65`);
  - add prompt rules beside the existing "CURRENT BROKER DATA is your only source of truth" block (`src/lib/services/copilot/copilot-prompt.ts:23-51`);
  - keep broker scoping through `requireBrokerApi()` and tool context (`src/app/api/broker/copilot/route.ts:66-121`; `src/lib/services/copilot/tools/build-copilot-tools.ts:16-22`).

## 10. Test Plan

Do not run these yet.

| Test type | Scope | Expected coverage |
|---|---|---|
| Unit tests | Local normalized adapter parser | Valid fixture parses; malformed local fixture rejects through Zod. |
| Unit tests | Subject normalizer | Vessel/owner/operator/charterer subjects produce stable query inputs without `any` or unsafe assertions. |
| Unit tests | Classifier | Exact IMO fixture -> `BLOCKED`; exact non-designated no-hit -> `CLEAR`; name-only/fuzzy -> `REVIEW`; source failure -> safe review state. |
| Unit tests | TTL/freshness | Result at 23h59m is fresh; result after 24h is derived `STALE`. |
| Service tests | Persistence coordinator | Creates immutable `ScreeningResult`; updates cache fields with status, `screenedAt`, `ttlExpiresAt`, source/list version. |
| Service tests | Review workflow | `REVIEW` can be reviewed with session broker; true `BLOCKED` cannot be broker-overridden. |
| Policy/gate tests | `ON_SUBS -> FIXED` | Allows fresh clear + lifted/waived subjects; rejects `BLOCKED`, stale, source error, unresolved review, and unresolved subjects. |
| API tests | Fixture status route | Re-checks before `FIXED`; rejects before fixture/status-change persistence when blocked. |
| API tests | Requirement and fixture creation | Requirement screens charterer; match screens shortlist; fixture create screens final parties. |
| UI tests | Dashboard/list/detail badges | `CLEAR`, `REVIEW`, `BLOCKED`, `STALE`, `NOT_SCREENED`, and `SOURCE_ERROR` render correctly. |
| UI tests | Fixture close action | Existing inline error path shows screening gate rejection. |
| Copilot tests | Evidence and refusal | Summarizes stored evidence with citations; refuses legal advice and override/clear requests. |

## 11. Implementation Order

1. Create the local normalized screening fixture format and Zod schema.
2. Add pure subject-normalization and classifier tests.
3. Implement the pure local adapter and classifier.
4. Add Prisma schema changes and migration for `Operator`, `ScreeningResult`, `ScreeningReview`, `Vessel.flagState`, and cache fields.
5. Add persistence coordinator tests and implementation for `ScreeningResult` plus cache updates.
6. Add review workflow tests and implementation for `REVIEW` and non-overridable true `BLOCKED`.
7. Add gate tests that compose screening rollup with the existing subject-lift transition gate.
8. Integrate the screening-aware gate into the status API route.
9. Integrate the same gate into the copilot `advanceFixtureStatus` executor.
10. Add requirement-create, match, and fixture-create screening triggers.
11. Extend dashboard/list/detail API shapes and Zod validators with screening rollups.
12. Add minimal UI badges and panels on dashboard, requirements list/detail, shortlist rows, and fixture timeline/close actions.
13. Extend copilot grounding summary and prompt rules for stored screening evidence and refusals.
14. Add/update focused tests for UI and copilot behavior.
15. Update living docs after implementation: README current-state sections, CHANGELOG, journal entry, PR doc, and any architecture/current-state docs that mention status gates or copilot boundaries.

## 12. Stop Conditions

- Stop if a proposed change adds `CLEAN_FIXED` or changes the locked `FixtureStatus` / `RequirementStatus` vocabulary.
- Stop if implementation needs live yente, OpenSanctions, direct government ingestion, AIS, voice/RAG, or beneficial-ownership traversal to complete the first slice.
- Stop if true `BLOCKED` requires a broker override to make the demo flow work.
- Stop if source data cannot produce auditable provenance fields: source/list name, version/date, screenedAt, and ttlExpiresAt.
- Stop if a route or copilot tool can persist `FIXED` without the screening-aware gate.
- Stop if the model is asked to decide sanctions status instead of explaining stored deterministic evidence.
- Stop if the local normalized fixture source would require rewriting point-in-time research history or laundering web-sourced facts as repo-confirmed.
- Stop if Prisma modeling cannot enforce one subject per `ScreeningResult` without a clear service validator.
- Stop if implementation touches Matter A landing/build WIP, generic UI polish, or unrelated app-code cleanup.
- Stop if tests or build failures appear that are unrelated to this sanctions slice; file/update an incident before continuing.

## 13. Readiness Verdict

```text
READY FOR IMPLEMENTATION SESSION
```

**Exact next action:** start a new implementation session from this packet, beginning with the local normalized screening fixture schema and pure classifier tests. Do not run broad code gates until implementation work exists and the Matter A/Matter B split is explicit.
