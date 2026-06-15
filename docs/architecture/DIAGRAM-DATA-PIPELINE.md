# Data Pipeline

How FixtureLog moves commercial data through the offshore workflow.

FixtureLog does not ingest live AIS or brokerage market feeds. It deliberately uses seeded commercial data plus one real external API, Open-Meteo Marine, so the demo is reliable and honest.

```mermaid
flowchart TB
  subgraph Seed["Seeded domain data"]
    Owners[Owners]
    Brokers[Brokers]
    Charterers[Charterers]
    Regions[Regions]
    Workscopes[Workscopes]
    Vessels[Vessels]
    Positions[PositionSnapshots]
    Benchmarks[RateBenchmarks]
  end

  Seed --> PG[(Postgres via Prisma)]

  subgraph Intake["Requirement intake"]
    ReqForm[Create enquiry / requirement form]
    ReqAPI[POST /api/requirements]
    ReqValidate[Zod RequirementCreateSchema]
  end

  ReqForm --> ReqAPI
  ReqAPI --> ReqValidate
  ReqValidate --> PG
  PG --> Requirement[Requirement status ENQUIRY]

  subgraph Matching["Shortlist generation"]
    MatchAPI[POST /api/requirements/id/match]
    LoadData[Load requirement + vessels + benchmarks]
    Matcher[FixtureMatcher]
    Ranked[Ranked shortlist with reasons]
  end

  Requirement --> MatchAPI
  MatchAPI --> LoadData
  LoadData --> Matcher
  Matcher --> Ranked
  Ranked --> Shortlisted[Requirement status SHORTLISTED]

  subgraph Fixture["Fixture workflow"]
    CreateFixture[POST /api/fixtures]
    StatusPolicy[FixtureStatusPolicy]
    Subjects[Subject items]
    Fixed[Fixture status FIXED]
  end

  Shortlisted --> CreateFixture
  CreateFixture --> StatusPolicy
  StatusPolicy --> Subjects
  Subjects --> Fixed

  subgraph Weather["Weather evidence"]
    WeatherAPI[GET /api/weather/marine]
    OpenMeteo[Open-Meteo Marine]
    Verdict[computeVerdict]
    Snapshot[WeatherSnapshot]
  end

  Fixed --> WeatherAPI
  WeatherAPI --> OpenMeteo
  OpenMeteo --> Verdict
  Verdict --> Snapshot
  Snapshot --> PG

  subgraph Recap["Recap generation"]
    RecapAPI[POST /api/fixtures/id/recap]
    Formatter[RecapFormatter]
    Recap[Markdown + plain text recap]
  end

  Fixed --> RecapAPI
  RecapAPI --> Formatter
  Formatter --> Recap
  Recap --> PG

  PG --> UI[Protected pages: map, requirements, charterers, fixtures]
```

## Pipeline Stages

| Stage | Source of Truth | Deterministic Rule |
|---|---|---|
| Seed data | `prisma/seed.ts` | Reproducible demo data, 30 vessels, regions, workscopes, fixtures, requirements |
| Requirement intake | `RequirementCreateSchema` + Prisma | New requirements start as `ENQUIRY` |
| Matching | `FixtureMatcher` | Hard filters first, then weighted scoring |
| Fixture workflow | `FixtureStatusPolicy` | `ON_SUBS -> FIXED` requires subjects lifted or waived |
| Weather evidence | `WeatherEnricher` + Open-Meteo | Current marine conditions become a workability verdict |
| Recap | `RecapFormatter` | SUPPLYTIME-style recap from structured fixture fields |
| Auth actor | `AppUser` -> `Broker` | Writes use the session-derived broker, not user-supplied actor fields |

## What to Say in the Interview

- "The data pipeline is intentionally honest: seeded commercial data plus one real weather API."
- "I separated workflow state from presentation. Status transitions live in a policy service, not in UI conditionals."
- "Weather evidence is persisted at decision time so a fixture can explain what the broker saw when making a decision."
- "The app is ready for a future AI copilot because the model would call typed tools on top of these deterministic services; it would not become the source of truth."
