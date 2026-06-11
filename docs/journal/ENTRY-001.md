# Journal Entry 001 — Project Started, Research Foundation Created

- **Date:** 2026-06-11
- **Type:** Project initialisation / research foundation
- **Branch:** main
- **Version:** 0.0.0 (pre-implementation)

---

## Summary

FixtureLog was started today as a portfolio demo for an SSY (Simpson Spence Young) Full-Stack Developer role. The repository was an empty git repo; this session established the **research and documentation foundation only**. No application code was written, no packages installed, no framework initialised — by design (see ADR-0001).

## What was done

- Inspected the repo (empty — zero tracked files) and confirmed no conflicts.
- Read four research source files (one technical-decision report, two domain knowledge bases, one refined SSY/technical report).
- Created the documentation structure under `docs/` (research, architecture, decisions, journal, build-packets, cursor-tasks, pull-requests).
- Produced **four cleaned research documents** in `docs/research/`:
  - `SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md` — synthesised domain reference (SSY, vessels, fixtures, recaps, AIS, market, competitive landscape).
  - `SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md` — recommended project, data model, pages/routes, build plan, worked end-to-end pipeline example.
  - `SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md` — real-vs-mock data strategy, API inventory, stack, deployment, seed figures.
  - `SSY-OFFSHORE-GLOSSARY.md` — plain-English glossary of broking/maritime/tech terms + cheat sheet.
- Created methodology docs: `docs/architecture/PROJECT-CONTEXT.md`, `docs/decisions/ADR-0001-research-first-methodology.md`, this journal entry, and `README.md`.

## Cleaning approach

- Removed broken exported citation markers (`citeturn…`, `fileciteturn…`).
- Preserved real source URLs and the `[INFERENCE]` / `[LIKELY]` / `[UNVERIFIED]` / `CONFIRMED` confidence tags.
- Kept plain-English explanations before technical maritime vocabulary.
- Did not invent facts or over-polish into marketing language.

## Key decisions / findings

- **Methodology:** research-first, packet-based; no code until decisions are documented (ADR-0001).
- **Strongest finding:** SSY's public offshore site exposes **Fixtures, Requirements, Positions, and a Live Weather Map** — the project mirrors this vocabulary.
- **Recommended (not final) direction:** Offshore Fixture Board + Recap Generator + Weather Window; **seeded data + one real API (Open-Meteo Marine)**; avoid enterprise AIS for the MVP.
- **Noted discrepancy:** SSY company-size figures conflict across sources (26–28 offices; ~550 to 1,000+ people) — use a range, never a single number.

## Files created

- `docs/research/SSY-OFFSHORE-BROKING-KNOWLEDGE-BASE.md`
- `docs/research/SSY-OFFSHORE-FIXTURE-PROJECT-BLUEPRINT.md`
- `docs/research/SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md`
- `docs/research/SSY-OFFSHORE-GLOSSARY.md`
- `docs/architecture/PROJECT-CONTEXT.md`
- `docs/decisions/ADR-0001-research-first-methodology.md`
- `docs/journal/ENTRY-001.md`
- `README.md`
- `docs/build-packets/`, `docs/cursor-tasks/`, `docs/pull-requests/` (placeholders)

## Open questions / blockers

- Final product scope and canonical status model still undecided (see PROJECT-CONTEXT §6).
- Architecture (Next.js full-stack vs separate Node API) not chosen.
- Whether to acknowledge SQL Server (role mentions it) or stay Postgres-only.

## Next step

Create the **first packet/spec** that locks the project direction: ratify the data strategy (ADR), define MVP scope, and reconcile the canonical data model. No implementation before that spec exists.
