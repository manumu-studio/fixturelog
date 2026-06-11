# Journal Entry 002 — Interview Confirmed + Interview-Prep Research Added

- **Date:** 2026-06-11
- **Type:** Research addition (interview prep)
- **Branch:** main
- **Version:** 0.0.0 (pre-implementation)

---

## Summary

The 1st-stage SSY interview was confirmed, and two interview-prep research reports were added and cleaned into the research foundation. Still no application code — research/planning phase continues.

## Interview (confirmed)

- **Monday 15 June 2026, 1:30–2:00 PM (30 min), MS Teams.**
- **Interviewer:** Joe Alexander — Head of Offshore Development Technology.
- **Recruiter:** Jai Bahra.

## What was done

- Read two interview-prep reports (Claude.ai + ChatGPT/compass).
- Created `docs/research/SSY-INTERVIEW-PREP-JOE-ALEXANDER.md` — merged + cleaned, conflict-flagged.
- Updated living docs: `PROJECT-CONTEXT.md` (interview status + stack-mismatch insight) and `README.md` (research list).

## Key findings

- **✅ Conflict resolved — LinkedIn profile found.** Report A's "Claude Code / very fast junior engineer" quotes are NOT in Joe's visible posts → treat as fabricated, do not use. Verified bio added to the prep doc.
- **🔑 Joe's verified background:** **Head of Development – Offshore** (since Jan 2026, ~5 mo in role); previously SSY **Full Stack Engineer** "building all things SSY" (likely built the offshore platform himself); ex-**Data Engineer** at MasterControl. Core skills **C#/.NET/SQL/Azure** (Microsoft stack), First-Class CS (Portsmouth), **hands-on**. → expect a peer-like, genuinely technical interview; strong SQL/data-integrity answers required; Manu's React/TS/Node is *complementary* value.
- **🔑 Stack mismatch (CONFIRMED):** SSY core = .NET/Blazor/SQL Server/Azure; offshore role = React/TS/Node/PostgreSQL → offshore platform likely built on/near the Microsoft stack by Joe; the role brings modern JS-ecosystem depth he lacks. Strong question to ask Joe.
- **Profile risk:** "never worked on a team" is the #1 risk — reframe solo discipline (CLAUDE.md, ~1,500 tests, sub-agent orchestration) as team-grade rigor.
- **Strategy:** 1st stage is conversational; full FixtureLog build is NOT required by 15 June — research/blueprint are the 1st-stage assets; build is 2nd-stage material.

## Files created / modified

- `docs/research/SSY-INTERVIEW-PREP-JOE-ALEXANDER.md` (created)
- `docs/architecture/PROJECT-CONTEXT.md` (updated — interview status, stack-mismatch)
- `README.md` (updated — research list)
- `docs/journal/ENTRY-002.md` (this file)

## Open questions / blockers

- Confirm with Joe in the interview whether the offshore platform is on .NET today or already React/Node, and whether this role builds it out or modernises it.
- Decide whether to ship any FixtureLog code before 15 June (recommendation: no — focus on domain fluency + blueprint).

## Next step

Prep for Monday using the interview doc. Optionally draft ADR-0002 (data strategy) and the first build spec for after the interview / 2nd stage.
