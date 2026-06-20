# Research Chain Governance Protocol

**Scope:** Governs every research stage in the FixtureLog → SSY chain (and is a reusable rule
across projects — graduation candidate for the ManuMu Operating System repo).
**Status:** Active rule. Applies from Stage 0 onward.

---

## Why this rule exists

Two researchers with opposite blind spots run this chain:

| Researcher | Strength | Blind spot |
|---|---|---|
| **Claude Code** (in-project) | Deep, exact context: the real files, decisions, prior research, current state | Narrow world — limited to "the mini-world of this project"; weak at broad web discovery |
| **Claude.ai** (web research) | Breadth — surfaces many findings, external practice, things the project can't see | Lacks project context, so it can be inaccurate about what actually matters here |

Neither is authoritative alone. The point of the chain is to make them **cross-check each
other**, with the human (Manu) as the arbiter who passes outputs between them and decides.

---

## Principle 1 — Outcome-First *(paramount of the paramount)*

**Every stage must define EXACTLY the outcome we want — in one sentence — BEFORE it runs.**

- The defined outcome of Stage N is the *tool* that lets us conduct Stage N+1. If Stage N
  produces nothing that enables the next move, the stage was mis-scoped.
- **No defined outcome → do not run the stage.** An undefined prompt is "blindly and aimlessly
  asking a machine," which then assumes on its own what is important. That research time goes
  to the trash and we lose time.

> Gate: a stage cannot launch until its target outcome is written as one sentence.

---

## Principle 2 — Relevance Gate *(the aim test)*

Before starting a chain, and before each stage, answer: **what is our main aim?**

The output must be relevant to the **next steps**. Classify the value we expect as one (or more) of:

- **Missing data** — facts we don't have and must have.
- **Pieces of information** — gap-fills that complete a picture we've started.
- **Transferable ideas** — patterns from other projects that can fit this one.

If a planned research output does not move the next step in one of these ways, it is noise — cut it.

---

## Principle 3 — Two-Party Calibration *(Claude Code ⇄ Claude.ai, human arbitrates)*

After each research output, run this loop before going deeper:

1. **Propose.** One party proposes whether the next research is appropriate and what it should
   be — *with the reasons*, grounded in its data/knowledge.
2. **Cross-check.** Both parties analyze the latest findings and explicitly **agree or disagree**
   — Claude Code judges them against real project context; Claude.ai judges them against external
   breadth.
3. **Decide who leads.** The human decides which party **leads the next stage**: Claude Code
   (when the move depends on project ground truth) or Claude.ai (when the move depends on
   external breadth). Disagreements are surfaced, not averaged away.

---

## Principle 4 — Directional Verdict *(the dead-end detector — mandatory for early stages)*

Every **early** research (Stage 0 and Stage 1) must end by returning **exactly one** of these
four verdicts about the direction we're heading — **always with reasons and the concrete next move:**

1. **WRONG PATH** — "You're putting effort into something that won't lead anywhere. *This* is the
   best way, and here's why."
2. **RIGHT, BUT REFOCUS** — "You're doing well, but focus on *this*, add *this*, and forget about
   *that*."
3. **NOVEL / UNEXPLORED** — "This is a good way to explore ideas I don't see anyone has
   implemented." *(promising, differentiated)*
4. **VALIDATED / EXISTING** — "Yes, that's the way — you're describing something that exists, and
   this is how it's done." *(confirmed against established practice)*

A verdict without reasons + a next move does not count.

---

## Principle 5 — Estimation is Deferred and Joint *(never pre-assumed by research)*

**Research stages must not attach time/effort estimates — no deadlines, no "3h / 1d / 2d" tiers — to findings or options.**

- Pre-judging duration during research **prematurely drops interesting options** before they're
  evaluated on merit. This is abstract guesswork at the wrong moment.
- Real effort estimation happens **later, jointly (human + AI), from actual results** — typically
  at synthesis. It is a decision we make *together*, not a field a research fills in blind.
- **Generic developer-velocity estimates do not apply here.** They come from developers who don't
  deliver or build the ManuMu way. Manu's effective velocity (AI-accelerated, disciplined operating
  system) is different, so external "how long does X take" assumptions are misleading and must never
  drive a cut.
- Research **may** note a purely *structural* property — e.g. whether a feature is **independent**
  (one PR = one story) — because that is about decoupling, not duration.
- A **soft outer horizon** (for this chain: ~3 days) MAY frame the *final* synthesis as a shared
  planning budget — but it is the human's frame, applied **jointly at synthesis**, never a
  per-feature duration assigned by research.

---

## Principle 6 — Evidence & Confidence Discipline *(graduated from `INCIDENT-AI-confabulated-task-premise`)*

**No claim about user intent or code state is stated without a confidence label and, for code, a `file:line`. When the source is not in view, say so — never reconstruct silently.**

- Every non-obvious claim about *intent* carries `CONFIRMED-from-message` / `INFERENCE` / `UNVERIFIED`. Every claim about *code* carries a `file:line`. A claim with neither is not allowed to stand.
- **Reconstruction is never presented as source.** If the original prompt or a file is lost to summarization/compaction, the honest move is to flag it ("I'm working from a reconstruction; the source isn't in view") and re-ground — not to fill the gap with a plausible, confident invention.
- **Lane honesty (pairs with Principle 3).** Claude Code verifies repo ground truth and must mark web-sourced facts as out of its lane; Claude.ai supplies web breadth and must mark project-state facts as out of its lane. Neither launders the other's claims as its own.
- This principle is binding from Stage 0 onward and was paid for by a real failure: an agent confabulated the task premise (hallucinated requirements + unread codebase "facts" presented as confirmed) and it collapsed only when asked for the verbatim prompt. The dividend is this rule.

---

## The Calibration Loop

Principles 1–4 run on **Stage 0 / Stage 1** outputs **until the prompt is calibrated** — i.e.
until the directional verdict tells us we're on the **real path** to the defined aim. Only then
do we proceed to the deeper stages (2–5). Early stages are allowed to *change the plan*; that is
their job.

---

## Pre-Launch Checklist *(stapled to every stage prompt)*

- [ ] **Outcome** defined in one sentence (Principle 1)
- [ ] **Relevance** to the next step stated, typed as missing-data / info-gap / transferable-idea (Principle 2)
- [ ] **Lead** decided for this stage — Claude Code or Claude.ai (Principle 3)
- [ ] **Directional verdict** required in the output (Principle 4, for early stages)
- [ ] **Hand-off** to the next stage specified, so it can run without rediscovery
- [ ] **No premature estimates** — structural notes only (independence), no durations (Principle 5)
- [ ] **Evidence & confidence** — every non-obvious intent/code claim carries a confidence label and a `file:line`; missing source is stated, never reconstructed (Principle 6)
