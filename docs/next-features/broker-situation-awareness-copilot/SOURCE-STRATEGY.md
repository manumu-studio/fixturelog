# Source Strategy

## Principle

Start with sources that are useful, explainable, and realistic to integrate. Treat each source by
strength. Do not make social or news signals sound like proof.

## Source Tiers

| Tier | Source type | Examples | First-slice role |
|---|---|---|---|
| 1 | Existing internal evidence | Fixture, vessel, operator, charterer, weather snapshots, screening results | Always included in digest context. |
| 2 | Keyless or already-used live evidence | Open-Meteo Marine via existing weather layer | Safe first live source because the app already understands weather evidence. |
| 3 | Official warnings/hazards | UKMTO, GDACS | Strong source class, but adapter practicality must be checked per source format. |
| 4 | News/media APIs | GDELT, Event Registry / NewsAPI.ai, Media Cloud | Best place to detect recent local signals. |
| 5 | Social media | X Recent Search or approved social-listening provider | Weak signal only. Requires access/licensing review. |
| 6 | AIS/live vessel data | AISStream, BarentsWatch | Optional later source. Do not block first slice on it. |

## Recommended Build Order

### 1. Internal Evidence Adapter

Reads existing FixtureLog data:

- vessel and IMO
- operator/owner/charterer
- region/workscope
- latest weather snapshot
- latest screening result
- fixture status and subjects

This makes the digest useful before external adapters are complete.

### 2. Local Fixture Source Adapter

Deterministic test adapter for CI and demos.

It returns seeded examples such as:

- one local news report
- one official warning
- one source-unavailable result
- one social signal

This proves the pipeline without flaky live calls.

### 3. News/Media Adapter

Target one of:

- GDELT for broad global media/event detection
- Event Registry / NewsAPI.ai for article/event search
- Media Cloud for media archive/search

Selection criteria:

- API access available
- terms acceptable for demo use
- query supports date window
- result includes title, URL, published date, and source

### 4. Official Warning Adapter

Target UKMTO or GDACS first.

Use official source strength and careful language.

### 5. Social Adapter

Only after access and terms are clear.

Rules:

- social signal alone creates `HEADS_UP`
- no social-only `NEEDS_BROKER_ATTENTION`
- show "unverified social signal" in UI
- never summarize social signal as proof

## Search Query Strategy

For each fixture, build controlled queries from:

- vessel name
- vessel IMO
- operator name
- owner name
- charterer name
- port name
- region name
- route label

Example query groups:

```text
"<vessel name>" OR "<IMO>"
"<operator name>" AND sanctions
"<port name>" AND strike
"<region name>" AND incident
"<route label>" AND warning
```

## Freshness Windows

| Source | Window |
|---|---|
| Official maritime warning | 24 hours by default, 72 hours visible in history |
| Weather/hazard | current to 72 hours depending on source |
| News/media | 72 hours |
| Social | 24 hours preferred, 72 hours max |
| Sanctions/party evidence | latest available list/source timestamp |

## Evidence Quality Rules

- Store source and timestamp every time.
- Store the query that produced the result.
- Store matched entity type and name.
- Do not store a natural-language summary without source evidence.
- Mark source failures as evidence of unavailability, not silence.

## Sources Not To Overclaim

- Social media: useful for awareness, not proof.
- Local news: useful context, but may be incomplete or duplicated.
- AIS: useful position context, but can be stale, spoofed, or unavailable.
- Sanctions: list match is evidence, not complete legal clearance.
