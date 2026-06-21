---
id: INCIDENT-AI-confabulated-task-premise
date: 2026-06-20
severity: SEV-2
status: RESOLVED
packet: none (AI-reliability / process incident)
branch: rescue/voice-logo-mixed-2026-06-17
environment: local (research-chain working session)
detected_by: user-report
related_incidents: []
fix_pr: null
resolved: 2026-06-20
---

# INCIDENT-AI — Assistant Confabulated the Task Premise (Hallucinated Requirements Presented as Fact)

> First AI-reliability incident in this registry. Failure mode: presenting a *reconstructed*
> understanding of the user's request — and unverified codebase facts — as if they were the user's
> verbatim requirements and confirmed ground truth.

---

## Problem

### Symptoms
- In the opening "here's what I understand you're asking for," the assistant (Claude Code) asserted
  specific requirements and facts **without a citable source**, presented with full confidence:
  - **Method:** *"your audit-classification-system/JOURNEY.md method (Decision-Memory Step 0,
    action→result-file→outcome path table, reusable method section, Breakage-Dividend entry, single
    cold-start handoff doc)"* — a 5-component method attributed to the user's request.
  - **Current-state facts:** Requirements "8× identical Equinor / PSV / North Sea / FIXED / 8,000",
    Charterers "plain list", Dashboard "3 duplicate Skandi Olympia fixtures with No weather snapshot
    yet" — asserted as verified state **without having read the page code**.
  - **Invented artifact:** transcript filename with a made-up sequence number `069` and an assumed date.
- When the user later asked for the **exact words of their original prompt**, the assistant could not
  produce them — confirming it had been operating on a reconstruction, not the source text.

### Impact
- **Users affected:** none (no production/data impact). Dev/working-session only.
- **Features broken:** the *foundation* of the research-chain task. The 5-stage chain design, the
  `RESEARCH-CHAIN-PROTOCOL.md` framing, the `STAGE-0-PROMPT.md` current-state claims, the
  `stage-0-pack/`, and the cross-check of Claude.ai's Joe-Alexander brief were all partly anchored on
  unverified premises.
- **Data at risk:** no.
- **Workaround exists:** yes — re-anchor on the user's actual original prompt + run a real,
  code-grounded Stage 0; relabel/strip every unverified premise.

### Reproduction Steps
1. Begin a task where the user's original prompt is **not preserved verbatim** in context (summarized/
   compacted before the first turn).
2. Produce a confident "reflection of understanding."
3. Observe invented specifics (method components, seed-data values, filenames) stated as fact.
4. Ask the assistant for the user's verbatim original prompt → it cannot produce it.

### Evidence
```
"...modeled on your audit-classification-system/JOURNEY.md method (Decision-Memory Step 0,
 action→result-file→outcome path table, reusable method section, Breakage-Dividend entry,
 single cold-start handoff doc)."   ← attributed to user; no citable source

"Requirements is 8× identical 'Equinor / PSV / North Sea / FIXED / 8,000' ... Dashboard shows 3
 duplicate 'Skandi Olympia' fixtures with 'No weather snapshot yet'"   ← asserted without reading code

Assistant, when asked for the verbatim prompt: "I do not have the exact words of your original prompt."
```

### Files Suspected
| File | Why suspected |
|------|--------------|
| `docs/research-V2/stage-0-pack/STAGE-0-PROMPT.md` | Embeds the unverified current-state claims as if confirmed |
| `docs/research-V2/RESEARCH-CHAIN-PROTOCOL.md` | Chain framing derived from a confabulated aim |
| `docs/research-V2/stage-0-pack/*` | Whole pack scoped by reconstructed premises |
| conversational reflections | Asserted user intent without confidence labels or sources |

### Root Cause Hypothesis
> The user's original prompt was lost to summarization/compaction before the first turn. Instead of
> flagging "I'm working from a reconstruction; the original isn't in view," the assistant **confabulated**
> the prompt's contents — pulling specifics from injected memory observations and the (later-read) OS doc
> and retro-attributing them to the user's request — and stated them with unwarranted confidence. It
> never ran real grounding to verify codebase claims (ENOSPC blocked recon; it proceeded on assumptions),
> and it violated the very evidence-first rule it authored ("no claim without a file:line or confidence
> label").

### What's Blocked
- Trusting any premise in the research-V2 chain until it is re-anchored on the user's actual prompt and
  a real, code-grounded Stage 0.

---

## Resolution

### Contributing Factors
1. **Context summarization dropped the source prompt.**
   - *How it contributed:* the assistant had no verbatim original to anchor on.
   - *Why it wasn't caught:* it never checked whether the source was in view before asserting intent.
2. **Confabulation to fill the gap.**
   - *How it contributed:* memory observations + the OS doc were retro-attributed to the user's request.
   - *Why it wasn't caught:* the reconstruction was plausible and internally consistent.
3. **No grounding before asserting code facts.**
   - *How it contributed:* seed-data claims were stated without reading the pages (ENOSPC blocked recon).
   - *Why it wasn't caught:* the assistant proceeded instead of blocking on its own missing evidence.
4. **Violated its own evidence-first rule** (no claim without file:line / confidence label).
5. **Followed Claude.ai's drift** into interview logistics instead of holding the defined aim (Principle 1).

### Was the Hypothesis Correct?
Yes. The failure was an evidence/anchoring failure: the assistant treated reconstructed context and
unverified codebase state as confirmed source material. The remediation was to rebuild the chain from
repo-visible evidence and confidence-labelled artifacts instead of relying on reconstruction.

Stage 0 re-anchored the current-state teardown on local project artifacts. Stage 0.1 then completed
the two missing evidence passes:

- **Pass A:** decision ledger from ADRs/specs.
- **Pass C:** first-round coverage map.

The user accepted Stage 0.1 as cleared on 2026-06-20 and explicitly authorized moving this incident
from `INVESTIGATING` to `RESOLVED`.

### Action Items
| Action | Owner | Status |
|--------|-------|--------|
| Re-anchor on the user's **verbatim original prompt**; re-derive the aim from it | Manu (paste) + Claude | DONE — Stage 0 re-anchored the chain on provided interview/project artifacts and local repo evidence. |
| Run a **real, code-grounded Stage 0**; verify or correct every current-state claim with `file:line` | Claude Code | DONE — `docs/research-V2/STAGE-0-OUTPUT-grounding.md`. |
| **Confidence-label all reflections of user intent** (`CONFIRMED-from-message` / `INFERENCE` / `UNVERIFIED`) — promote to a new Protocol principle | Claude Code | DONE — Stage 0.1 uses confidence labels + no-claim-without-evidence discipline, and the rule is now graduated to **Principle 6 (Evidence & Confidence Discipline)** in `RESEARCH-CHAIN-PROTOCOL.md`. |
| When the source isn't in view due to summarization, **say so explicitly**; never reconstruct silently | Claude Code | DONE — captured as binding lesson in Stage 0.1 and continuation handoff. |
| Audit artifacts already produced (chain, protocol, prompt, cross-checks); strip/relabel unverified premises | Claude Code | DONE — Stage 0.1 delivered the decision ledger, superseded-material map, unresolved questions, and first-round coverage map. |

### Lessons Learned
**What could be better:**
- Treat "I don't have the source in view" as a hard stop, not a gap to fill with plausible reconstruction.
- The Breakage Dividend here: a new rule — *reflections of user intent and codebase state carry confidence
  labels; reconstructed context is never presented as verbatim.* **Graduated** to
  `RESEARCH-CHAIN-PROTOCOL.md` as **Principle 6 (Evidence & Confidence Discipline)** on 2026-06-20; still a
  graduation candidate for the ManuMu Operating System repo.

**Where we got lucky:**
- The user caught it before any of it shipped into FixtureLog code or an external interview artifact.

---

## Conclusion
Resolved. The assistant reconstructed the user's request from summarized context and unverified
memory, then presented that reconstruction — plus unread codebase "facts" — as confirmed
requirements. The remediation is complete: Stage 0 re-grounded the current-state teardown, Stage 0.1
completed the decision-memory and first-round coverage passes, the Stage 1 pack is gated by those
artifacts, and the user accepted Stage 0.1 as cleared. Prevention remains binding: confidence-label
all intent/state claims, hard-stop when source material is not in view, and never present
reconstruction as source.
