# ADR-0001: Research-First, Packet-Based Methodology

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Manu Murillo
- **Context tags:** methodology, process, foundation

---

## Context

FixtureLog is a portfolio demo for an SSY Full-Stack Developer role. It will likely become an offshore broking workflow demo (vessel matching, fixture tracking, recap generation, marine weather checks), but **no final product or technical decisions have been made**. We have substantial domain and technical research, and we want to avoid the common failure mode of writing speculative code before the problem and the approach are clearly understood and documented.

This project reuses the proven methodology from the `learning-speaking-app` project.

---

## Decision

1. **We adopt a research-first, packet-based methodology.** Work proceeds in small, focused packets, each with task files written **before** implementation.
2. **No implementation until product and technical decisions are documented.** Application code, package installation, and framework initialisation are deliberately deferred until a spec/packet defines the work.
3. **Research documents are the source of truth for the first planning phase.** The initial research archive informed the project blueprint, technical decisions, and glossary until superseded by specs and ADRs. The public repo now treats ADRs and specs as the canonical source.
4. **Future implementation must be split into packets and task files.** Each packet ends with documentation: journal entry, PR doc, version bump, and living-doc sync (README, etc.).
5. **Decisions are recorded as ADRs** in `docs/decisions/`. This ADR is the first; subsequent decisions (e.g. final product scope, canonical status model, data strategy lock-in) get their own ADRs.

---

## Consequences

**Positive:**
- Decisions are explicit, reviewable, and reversible with a paper trail.
- Reduced wasted effort — no code is written against an undecided design.
- Onboarding and context-recovery are fast (ADRs + specs + journal).
- Matches the disciplined-delivery story the SSY role values.

**Negative / costs:**
- Slower to first line of code (intentional).
- Requires discipline to keep docs in sync as decisions change.

**Follow-ups (open decisions to be made in future ADRs/specs):**
- Final product scope (MVP vs stretch).
- Canonical fixture/requirement status model.
- Architecture (Next.js full-stack vs separate Node API).
- Data strategy lock-in (seeded + Open-Meteo) — strongly recommended by research, to be ratified.
- PostGIS / AISStream.io / Python service inclusion.

See `docs/architecture/PROJECT-CONTEXT.md` §6 for the current open-decision list.
