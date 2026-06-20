# STAGE 0 OUTPUT — Grounding & First-Round Delta

**Run by:** Claude Code (in-project, no web) | **Date:** 2026-06-20
**Inputs read:** `prisma/schema.prisma`, `prisma/seed.ts`, the four (app) pages, `requirements/[id]`,
`fixture-matcher.ts`, `copilot/copilot-prompt.ts`, plus the verified structural inventory (services,
validators, 30 API routes). **Interview evidence:** transcript + job spec + emails (CONFIRMED).
**Passes complete:** B (current-state teardown), D (gaps + relevance), Directional Verdict.
**Passes pending** (need ADR/spec/research reads — *refine*, don't change the verdict): A (decision
ledger), C (first-round coverage map).

---

## ⚠️ Correction to the prior (hallucinated) premise
The earlier framing — *"bare seed-data shell; Requirements 8× identical Equinor; Dashboard 3×
duplicate Skandi Olympia, no weather"* — is **FALSE**, confirmed against the code
(`INCIDENT-AI-confabulated-task-premise`). The real state is rich and varied. Everything below is
evidence-backed.

## Current-state inventory (REAL / SEEDED / BARE)

| Area | Verdict | Evidence |
|---|---|---|
| Domain model — 15 models, negotiation state machines (`RequirementStatus`, `FixtureStatus`), `PositionSource.AIS` ready, vessel-image honesty enum | **REAL** | `schema.prisma:14-413` |
| Matching engine — two-stage (hard filter → weighted distance/rateFit/capability), pure fn | **REAL** (matches Manu's demo pitch) | `fixture-matcher.ts:135-175` |
| Broker copilot — grounded, context-only, fixed "I don't know" phrase, never-invent, prompt-injection defence, **read tools + write tools PROPOSED for human approval** | **REAL** (literally the spec's "AI-First Thinking / verify not blindly accept") | `copilot-prompt.ts:19-51` |
| Voice copilot — wired on the dashboard | **REAL** | `dashboard/page.tsx:62` → `/api/broker/voice/token` |
| Broker dashboard — enquiry queue, fixture timeline w/ close-actions (lift subjects, advance status), pending actions, copilot, voice | **REAL / polished** | `dashboard/page.tsx:41-64` |
| Map — Leaflet + FleetExplorer gallery/modal | **REAL** | `map/page.tsx:32` |
| Requirement detail / ranked shortlist | **REAL** | `requirements/[id]/page.tsx:34-45` |
| Weather — `WeatherSnapshot` w/ WORKABLE/MARGINAL verdicts; Open-Meteo live (per transcript) | **REAL** | `schema.prisma:397`, `seed.ts:425-456` |
| Recap — SUPPLYTIME-style markdown+text recap | **REAL** | `Recap` model, `seed.ts:459-511` |
| Client portal — enquiries/fixtures/documents/fleet | **REAL** | `src/app/portal/*` |
| Seed data — 8 real owners, 6 real charterers (`.example` emails), 30 vessels w/ real IMOs + 21 Wikimedia CC photos (honest credit), 5 varied requirements, 5 fixtures across NEGOTIATING/ON_SUBS/FIXED, subjects, recaps, weather | **SEEDED** (realistic, honestly labelled) | `seed.ts:106-666` |
| Vessel positions | **SEEDED only** (`source: 'SEEDED'`) — no live AIS yet | `seed.ts:242` |
| **`/requirements` list page** | **BARE UI** — functional + Zod-validated, but a raw unstyled `<table>` (no `page.module.css`) | `requirements/page.tsx:33-66` |
| **`/charterers` list page** | **BARE UI** — same raw table | `charterers/page.tsx:29-58` |

## Gap list (the genuine gaps — each independent, one PR = one story)
1. **Polish `/requirements`** — raw table → the polished `PortalPageHeader`/component system used by dashboard/map/portal. *(UI consistency)*
2. **Polish `/charterers`** — same. *(UI consistency)*
3. **Sanctions / operator-risk screening** — **none exists** (no schema field, no feature). Joe named this as a **daily key decision** ("operator suddenly on a sanctions list → can't operate"). Highest-signal differentiator. → Stage 1.
4. **Live AIS positions** — schema already supports `PositionSource.AIS`; seed uses SEEDED only. Hybrid-data opportunity. → Stage 4.

## Relevance boundary
- **In scope:** offshore/OSV broker workflow; polish of the two raw pages; the sanctions feature; AIS.
- **Out of scope:** SSY's other desks; rebuilding what already works (matching, copilot, recap, weather, portal); interview logistics (separate side-errand).

## Hand-off to Stage 1 (refocused — the ONE real web-research gap)
- **Sanctions/operator-risk screening for offshore broking:** which lists matter (OFAC SDN, EU, UK OFSI?), how brokers actually use screening in the enquiry→fixture flow, what free/cheap data sources exist, and whether any broking platform already does it (novel vs table-stakes).
- Secondary (Stage 4): viable free AIS sources and whether live positions materially improve the demo over seeded.

## DIRECTIONAL VERDICT — `RIGHT, BUT REFOCUS` (the original "build from bare" premise was WRONG)
**Reasons:** FixtureLog is not a shell to build into a broker tool — it already *is* one (matching +
weather + recap + negotiation state machine + guardrailed human-in-the-loop copilot + voice), and
the interview confirmed it ("you've proven you can do it"; "exactly what we build on the offshore
side"). Researching "what a broker needs / what belongs on a dashboard" from scratch would re-derive
what's already built — wasted effort.
**Concrete next move:** collapse the original 5-stage chain. Keep only: (1) a *narrow* Stage 1 on
**sanctions/operator screening** (the one feature Joe named, currently absent); (2) a small Stage 4
on **AIS** sourcing; (3) two independent UI-polish tasks (requirements, charterers). Everything else
is already done. Effort tiers decided jointly, later (Principle 5).
