# Broker Situation Awareness Copilot PoC

## Purpose

This document explains how FixtureLog can grow from a workflow demo into a realistic proof of
concept for broker situational awareness.

The goal is not to build a compliance system. The goal is to help a broker see whether something
new may have happened around a vessel, operator, port, route, or region before the deal is fixed.
The broker still decides what matters.

## One-Line Idea

FixtureLog already shows that I understand the offshore broking workflow. The next extension is a
copilot that pulls recent external signals from real sources and gives the broker a plain-English
brief before they close the deal.

## From Demo To Product Idea

FixtureLog currently models the core offshore workflow:

1. A charterer creates an enquiry.
2. The broker receives the requirement.
3. The system builds a ranked vessel shortlist.
4. The broker negotiates the fixture.
5. The fixture moves through subjects and status changes.
6. Weather evidence and screening evidence are stored.
7. The broker generates a recap.

That proves the demo understands the shape of an offshore broker company. It is not a generic CRUD
app. It follows the path from enquiry to fixture.

The next feature extends that workflow at the moment where context matters most: before the broker
moves toward `FIXED`.

Instead of only showing seeded vessel and fixture data, the system would ask:

> Has anything new appeared in the last 24 to 72 hours that the broker should know before making the
> decision?

The answer is not a legal judgement. It is a situational brief.

## What The Broker Gets

The broker gets a short natural-language summary around the vessel and deal context:

- what changed
- where it came from
- when it was published
- which object it relates to: vessel, operator, owner, charterer, port, route, or region
- why it may be worth attention
- whether the source is official, news, social, or unavailable

Example:

> Heads-up: in the last 48 hours, UKMTO published a maritime security warning near the planned route.
> Two local news sources also reported port disruption in the same area. This does not block the deal,
> but it may be worth checking before moving the fixture forward.

## Language Boundary

The feature should use careful language.

Use:

- `No new signal`
- `Heads-up`
- `Needs broker attention`
- `Source unavailable`

Avoid:

- `Safe`
- `Approved`
- `Cleared`
- `Blocked`
- `Compliant`
- `Predicted risk`

The system should never say that a vessel is safe. It should say that it found, or did not find,
recent signals worth showing to the broker.

## Data Sources

The first version should use real external sources, but each source must be treated according to its
strength.

| Source type | Example sources | Role in the feature |
|---|---|---|
| Official sanctions and party data | OFAC Sanctions List Service, UK Sanctions List, OpenSanctions/yente | Strongest source category. Used for party/vessel screening and provenance. |
| Maritime security | UKMTO warnings and recent incidents | Strong signal for route or regional awareness. |
| Weather and hazards | Open-Meteo Marine, GDACS | Useful for workability and natural-hazard context. |
| Port disruption | IMF PortWatch, port authority notices where available | Useful for route, port, and supply-chain awareness. |
| Global and local news | GDELT, Event Registry / NewsAPI.ai, Media Cloud | Early-warning layer for local context, strikes, incidents, unrest, and port issues. |
| Social media | X Recent Search or approved social-listening provider | Weak early-warning layer only. Never used alone as a strong conclusion. |
| AIS / vessel positions | AISStream or BarentsWatch as optional future integration | Optional live-position layer. The PoC can still use seeded vessel positions honestly. |

## How I Would Use Social And Local News

Social media and local newspapers are useful because they can surface early signals before formal
sources are updated. However, they are noisy.

For that reason, the feature should treat them as attention signals, not decisions.

Rules:

1. A single social post can only create a `Heads-up`.
2. Repeated independent reports can create `Needs broker attention`.
3. An official advisory or list is required for any strong workflow gate.
4. Every summary must show the source and timestamp.
5. The copilot must say when a signal is unverified.

This keeps the product useful without overclaiming.

## Technical Decisions

### 1. Keep The Broker In Control

The copilot summarizes. It does not decide.

The broker should be able to open the source, read the evidence, and decide if it is relevant to the
fixture.

### 2. Store Evidence, Not Just Text

Each signal should be saved as structured evidence:

- `sourceName`
- `sourceType`
- `sourceUrl`
- `publishedAt`
- `fetchedAt`
- `matchedEntity`
- `matchedEntityType`
- `confidence`
- `summary`
- `rawSnippet`

The natural-language summary should be generated from stored evidence, not from memory.

### 3. Validate Every External Boundary

Every external API response should be parsed and validated before the app uses it.

The pattern should stay consistent with FixtureLog:

- Next.js route handler
- Zod validation at the boundary
- service layer for source adapters
- Prisma persistence
- PostgreSQL evidence tables
- React UI showing source and freshness

### 4. Separate Source Strength

The system should rank source strength:

| Strength | Meaning | Example |
|---|---|---|
| Official | Direct authority or official warning | OFAC, UK Sanctions List, UKMTO, GDACS |
| Trusted news | Established local or global media source | local newspaper, Reuters-style source, Event Registry result |
| Open media signal | Broad media/event detection | GDELT, Media Cloud |
| Social signal | Public post or trend | X post, public social mention |

This allows the copilot to speak carefully. A social signal can be useful, but it should not sound
like proof.

### 5. Use Freshness Windows

The feature is specifically about recent changes, so every query should focus on the last 24 to 72
hours.

Suggested windows:

- 24 hours for official warnings and breaking news.
- 72 hours for local news, social signals, and port disruption.
- Re-check before the broker moves a fixture toward `FIXED`.

### 6. Keep Seeded Data Honest

The PoC can still keep vessel master data seeded if live AIS is out of scope. That is acceptable as
long as the UI is honest.

The extension is that the external signals are real:

- real weather
- real maritime warnings
- real news/media search
- real sanctions/list-source posture

That is enough to show a credible path from demo to production-style feature.

## Suggested Architecture

```text
Active fixture
  -> collect context
      vessel name / IMO
      operator
      owner
      charterer
      port
      route
      region
  -> run source adapters
      sanctions adapter
      maritime warning adapter
      weather/hazard adapter
      news adapter
      social adapter
      port-disruption adapter
  -> validate responses with Zod
  -> store SignalEvidence rows in Postgres
  -> classify softly
      No new signal
      Heads-up
      Needs broker attention
      Source unavailable
  -> generate natural-language broker brief
  -> show evidence and sources in React
```

## Candidate Data Model

```text
Fixture
  -> Vessel
  -> Operator
  -> Charterer
  -> SignalDigest
      -> SignalEvidence[]
```

Possible new tables:

- `SignalDigest`: one digest per fixture and freshness window.
- `SignalEvidence`: one stored external source item.
- `SignalSource`: configuration for source type, strength, and freshness rules.

The existing `ScreeningResult` pattern can inspire the evidence model, but this feature should use
softer language because the goal is awareness, not clearance.

## API Shape

### Generate Or Refresh A Digest

```http
POST /api/fixtures/:id/situation-digest
```

Request:

```json
{
  "windowHours": 72
}
```

Response:

```json
{
  "fixtureId": "fixture_123",
  "state": "HEADS_UP",
  "summary": "Recent maritime security and local news signals were found near the planned route.",
  "sources": [
    {
      "type": "MARITIME_WARNING",
      "name": "UKMTO",
      "publishedAt": "2026-07-05T10:00:00.000Z",
      "url": "https://www.ukmto.org/recent-incidents"
    }
  ]
}
```

### Read Latest Digest

```http
GET /api/fixtures/:id/situation-digest
```

## Copilot Behaviour

The copilot can answer:

- "What changed around this vessel?"
- "Is there anything new near the route?"
- "Why is this marked as needs attention?"
- "Which sources did you check?"

The copilot should refuse:

- "Is this vessel safe?"
- "Can I close the deal?"
- "Is this legally compliant?"
- "Should I ignore this warning?"

Safe answer pattern:

> I cannot decide that for you. What I can show is the evidence I found, when it was published, and
> which part of the fixture it may relate to.

## Implementation Plan

### Phase 1: Report-Only PoC

Goal: prove the idea without changing the live workflow.

Build:

- fixture context extractor
- one digest page or panel
- Open-Meteo Marine adapter
- GDELT or NewsAPI.ai adapter
- UKMTO adapter if practical
- stored evidence table
- natural-language summary from stored evidence

No workflow blocking. No compliance claim.

### Phase 2: Broker Review UI

Goal: make the signal useful inside the broker workflow.

Build:

- digest card on fixture detail
- source list with timestamps
- "mark as reviewed" action
- "not relevant" action
- "needs follow-up" action
- audit trail of broker review

The broker decides relevance.

### Phase 3: More Source Adapters

Goal: make the view broader and more realistic.

Add:

- Event Registry / NewsAPI.ai
- Media Cloud
- GDACS
- IMF PortWatch
- official sanctions source posture
- optional X Recent Search for social signals

Social signals stay weak unless corroborated.

### Phase 4: Copilot Integration

Goal: let the broker ask natural-language questions over the digest.

Build:

- read-only copilot tool: `getFixtureSituationDigest`
- source-cited answers
- refusal rules for legal/commercial decisions
- tests proving the copilot cannot clear, approve, or close a fixture

### Phase 5: Pre-FIXED Reminder

Goal: place the warning at the right moment.

Before a broker moves a fixture toward `FIXED`, show:

- latest digest age
- whether sources were available
- key recent signals
- reviewed/not-reviewed status

This is a warning and review surface, not an automatic decision.

## Demo Story For Interview

1. A fixture is almost ready to close.
2. The vessel looks commercially suitable.
3. Before the broker moves forward, the copilot refreshes the last 72 hours.
4. It finds a UKMTO warning near the route and two local news items about port disruption.
5. It summarizes the situation in natural language.
6. The broker can open the sources and decide if it matters.
7. The system records that the broker reviewed the brief.

What I would say:

> I am not trying to make the software decide. I am trying to give the broker a better picture before
> the decision. If something relevant changed in the last 24 to 72 hours, the broker should see it in
> one place, with sources and timestamps.

## What This Proves

- I understand the offshore broking workflow beyond the UI.
- I know where a broker needs context before commitment.
- I can move from seeded demo data to real external signals without pretending everything is live.
- I can design API boundaries, source validation, evidence storage, and natural-language summaries.
- I can use AI carefully: as an explainer, not as a decision-maker.

## What Not To Claim

- Do not claim it is a sanctions platform.
- Do not claim it clears a vessel.
- Do not claim social media proves a risk.
- Do not claim the system replaces broker judgement.
- Do not claim all data is real-time.
- Do not claim it makes the legal or commercial decision.

## Interview Summary

FixtureLog started as a demo to show I understand the offshore workflow. It already follows the deal
from enquiry to shortlist, fixture, status, weather, screening evidence, and recap.

The next step is to make it more realistic by adding a situation-awareness layer. It would pull real
external signals from official sources, local news, social media, weather, port, and maritime-warning
data. Then it would summarize what changed in the last 24 to 72 hours in natural language.

The broker still decides. The system just helps them see the current picture before they make the
decision.
