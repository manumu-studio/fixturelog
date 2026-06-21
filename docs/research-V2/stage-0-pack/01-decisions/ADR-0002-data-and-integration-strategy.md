# ADR-0002: Data and Integration Strategy

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Manu Murillo
- **Context tags:** data, integration, weather, seeding

---

## Context

FixtureLog needs a data and integration model before any schema or service code is written. The questions are: where does authoritative data come from, which external systems do we integrate, and how do we keep the demo honest, deterministic, and cheap to run in CI.

The domain research (`docs/research/SSY-OFFSHORE-TECHNICAL-DECISION-RESEARCH.md`) surveys the available data sources: enterprise AIS providers (MarineTraffic, Spire, Kpler), the free AISStream.io feed, and the free Open-Meteo Marine API. SSY's real enterprise stack is .NET on SQL Server, while the offshore broking demo targets a serverless Postgres deployment. We must decide what to integrate now versus defer, and how to represent provenance so seeded data is never mistaken for live data.

This ADR ratifies the data and integration strategy only. Application architecture is recorded separately in `docs/decisions/ADR-0003-application-architecture.md`; scope tiering and the data model live in `docs/specs/SPEC-001-mvp-build.md`.

---

## Decision

1. **Seeded PostgreSQL is the system of record.** The database is populated with realistic seed data: 20–40 real offshore support vessels and real owners/charterers (Tidewater, Solstad, DOF, Havila, Island Offshore), real North Sea ports, and realistic day-rate ranges (e.g. North Sea PSV spot ~GBP 7,134/day, large AHTS spot ~GBP 56,798/day). All matching, fixture, recap, and dashboard logic reads from Postgres.

2. **Open-Meteo Marine is the single real external API.** It is free, requires no API key and no signup, covers the North Sea at ~5 km resolution, and returns wave height, swell, and wind-wave data that drive the workability verdict. No other live integration ships in the MVP.

3. **AIS and enterprise feeds are deferred to post-MVP.** AISStream.io and all paid enterprise AIS (MarineTraffic, Spire, Kpler) are out of scope for the MVP. They are recorded as a README "future work" line, not a build-week stretch goal.

4. **Honesty rule: provenance is explicit in data and UI.** Seeded data is labelled as seeded, never presented as live. `PositionSnapshot.source` (`SEEDED | MANUAL | AIS | IMPORTED`) and `PositionSnapshot.confidence` (`HIGH | MEDIUM | LOW`) carry provenance through the model, surface in the UI, and are explained in the README. The deferred AIS path is what `source = AIS` is reserved for.

5. **Weather is persisted as a decision-time snapshot.** When a broker checks workability, the app writes a `WeatherSnapshot` record (wave height, swell, wind-wave, workability verdict, lat/lng, laycan window, `fetchedAt`) linked to the fixture. A short-TTL cache backs ad-hoc "current conditions" lookups. This models decision-time provenance and keeps CI and Playwright e2e hermetic: tests seed a snapshot and never call the live API. A fully on-demand approach was rejected because it hammers the API and produces non-deterministic tests.

6. **Postgres-only for the demo.** The MVP runs on Postgres alone (deployed on Neon, which is Vercel-native and supports PostGIS for the day-5 distance stretch). No SQL Server, and no Python service, in the MVP. The README acknowledges the contrast between SSY's enterprise .NET/SQL Server stack and this offshore platform's Postgres choice, and notes a polyglot/SQL Server path as future work.

---

## Consequences

**Positive:**
- One real integration demonstrates external-API competence without the cost, keys, or rate limits of enterprise feeds.
- Persisted weather snapshots make CI and e2e deterministic and offline-safe, and record the conditions a fixture decision was actually made under.
- The source/confidence fields make the honesty story concrete and give the deferred AIS layer a clean insertion point.
- Realistic seed data (real operators, ports, and day rates) reads as a credible broking dataset rather than placeholder content.

**Negative / costs:**
- Seed data must be curated and kept plausible; stale rates or wrong operator details undercut credibility.
- The persisted-snapshot model adds a write path and a cache to maintain versus a naive on-demand fetch.
- A single external API means a single point of integration failure for live weather; mitigated by the cache and seeded snapshots.

**Follow-ups:**
- Application architecture, the service layer, and the named services (WeatherEnricher, etc.) are recorded in `docs/decisions/ADR-0003-application-architecture.md`.
- Scope tiering and the full data model (entities, enums, relations including `WeatherSnapshot` and `PositionSnapshot`) are defined in `docs/specs/SPEC-001-mvp-build.md`.
- The deferred AIS/enterprise-feed and SQL Server/Python paths are tracked as future work; see `docs/roadmap/ROADMAP.md`.
