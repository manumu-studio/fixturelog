# Technical Design

## Goal

Build a broker-only situation-awareness feature that collects recent external signals, stores them
as evidence, and lets the copilot summarize them without making a decision for the broker.

## Architecture

```text
Broker clicks "Refresh situation"
  -> POST /api/fixtures/:id/situation-digest
      -> requireBrokerApi()
      -> load fixture context
      -> run source adapters
      -> Zod-validate every adapter result
      -> classify soft digest state
      -> persist SignalDigest + SignalEvidence[]
      -> return digest response

Broker asks copilot "what changed?"
  -> broker brain read tool
      -> load latest SignalDigest
      -> summarize stored evidence only
      -> cite source names + timestamps
      -> refuse legal/commercial decisions
```

## Core Components

| Component | Responsibility |
|---|---|
| `fixture-situation-context` | Loads fixture, vessel, operator, owner, charterer, route, port, and region context. |
| `situation-source-adapter` | Shared interface for source-specific adapters. |
| `news-source-adapter` | Queries news/media APIs for recent local or route-related reports. |
| `weather-hazard-adapter` | Reuses or complements Open-Meteo/GDACS evidence. |
| `maritime-warning-adapter` | Reads maritime warning or incident sources where practical. |
| `signal-classifier` | Creates soft digest state from evidence strength and source availability. |
| `situation-digest-writer` | Persists digest and evidence rows in one transaction. |
| `situation-digest-presenter` | Converts stored evidence into API/UI DTOs. |
| `copilot read tool` | Exposes latest digest to the broker copilot as read-only context. |

## Source Adapter Interface

```ts
export type SituationSourceKind =
  | 'official'
  | 'trusted_news'
  | 'open_media'
  | 'social'
  | 'weather'
  | 'port';

export interface SituationSourceQuery {
  fixtureId: string;
  vesselName: string;
  vesselImo: string | null;
  operatorName: string | null;
  chartererName: string;
  regionName: string;
  portName: string | null;
  routeLabel: string | null;
  windowHours: number;
}

export interface SituationSourceEvidence {
  sourceName: string;
  sourceKind: SituationSourceKind;
  title: string;
  url: string | null;
  publishedAt: Date | null;
  fetchedAt: Date;
  matchedEntityType: 'vessel' | 'operator' | 'owner' | 'charterer' | 'port' | 'route' | 'region';
  matchedEntityName: string;
  snippet: string;
  confidence: 'low' | 'medium' | 'high';
  isOfficial: boolean;
}

export interface SituationSourceAdapter {
  id: string;
  sourceName: string;
  run(query: SituationSourceQuery): Promise<SituationSourceEvidence[]>;
}
```

## Soft Classifier

```text
No evidence + all sources available
  -> NO_NEW_SIGNAL

One or more low-confidence social/open-media signals
  -> HEADS_UP

Official warning, trusted news corroboration, or multiple independent signals
  -> NEEDS_BROKER_ATTENTION

All required sources failed or digest cannot be refreshed
  -> SOURCE_UNAVAILABLE
```

The classifier does not produce `SAFE`, `CLEAR`, or `BLOCKED`.

## Copilot Boundary

The copilot may say:

- "I found two recent signals near the planned route."
- "The sources are UKMTO and local news."
- "The digest was refreshed 35 minutes ago."
- "This may be worth broker attention."

The copilot must refuse:

- "This vessel is safe."
- "You can close the deal."
- "This is compliant."
- "Ignore this warning."

Refusal text:

> I cannot decide that. I can show the evidence, source, timestamp, and why it may be relevant.

## First Slice

The first implementation should not depend on paid API keys.

Recommended first slice:

- fixture context extraction
- `SignalDigest` and `SignalEvidence` tables
- one keyless weather/source adapter using existing Open-Meteo path or fixture weather snapshots
- one news/media adapter behind an environment flag
- deterministic local fixture adapter for tests
- broker-only refresh/read routes
- digest UI panel
- read-only copilot tool

## Reuse Existing Patterns

- Use `requireBrokerApi()` for broker-only route access.
- Use Zod at every external boundary.
- Use Prisma for persistence.
- Keep services deterministic and unit-tested.
- Preserve human-in-the-loop rules from ADR-0004.
- Do not add RAG until there is a curated corpus, per ADR-0005.
