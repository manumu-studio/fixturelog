# Why The First Pilot Version Failed

This note prevents duplicate work. Do not repeat the first pilot's mistake.

## What Failed

The first pilot treated FixtureLog as if it were a broad, underbuilt shell that needed research into
"what a broker tool should be." That premise was wrong.

Stage 0 later checked the actual code and found FixtureLog is already a near-complete offshore
broking tool: domain model, matching, weather, recaps, dashboard, charterer portal, human-in-the-loop
copilot, and voice all exist.

## Why It Failed

1. **It was too generic.**
   It resembled a one-size-fits-all audit/research checklist, not a project-specific decision system.

2. **It re-researched settled questions.**
   It spent attention on broad broker-dashboard/product questions that FixtureLog had already answered.

3. **It was partly built on a hallucinated premise.**
   An earlier agent confidently described the app as "bare" without having grounded that claim in the
   real code. That was filed as `INCIDENT-AI-confabulated-task-premise`.

4. **It drifted from the goal.**
   The goal is to improve the FixtureLog -> SSY demo. Some research drifted toward interview logistics
   or generic shipping context instead of the next product decision.

5. **It risked duplicating the same broad research loop.**
   Without a tight Stage 1 scope, Claude.ai could repeat "what does a broker need?" instead of answering
   the only missing research question: sanctions/operator-risk screening.

## What Must Happen Instead

Stage 1 must research only:

- which sanctions/operator-risk lists matter;
- how screening fits into the enquiry -> fixture workflow;
- what public/free/cheap sources exist;
- whether platforms already expose this;
- what narrow FixtureLog feature should be built next.

Stage 1 must **not** research:

- generic broker dashboards;
- whether FixtureLog needs matching, weather, recap, portal, or copilot;
- generic shipbroking basics already covered by first-round research;
- AIS, except where sanctions data directly depends on vessel identity;
- voice/RAG architecture;
- interview follow-up strategy.

## Decision Rule

If a finding does not help decide the sanctions/operator-risk feature, cut it.
