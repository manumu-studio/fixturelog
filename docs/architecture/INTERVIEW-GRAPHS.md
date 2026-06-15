# FixtureLog Interview Graphs

This folder contains the interview-friendly system diagrams for FixtureLog. The format follows the documentation style used in Helical Bio Explorer and Learning Speaking App: compact Markdown, Mermaid graphs, and short explanation blocks that are easy to rehearse before an interview.

Use these as the high-level memory map:

| Document | What to Explain |
|---|---|
| [DIAGRAM-CI-CD.md](DIAGRAM-CI-CD.md) | How a pull request becomes a verified deployable build |
| [DIAGRAM-REQUEST-FLOW.md](DIAGRAM-REQUEST-FLOW.md) | How a browser action becomes a validated API response |
| [DIAGRAM-DATA-PIPELINE.md](DIAGRAM-DATA-PIPELINE.md) | How the offshore workflow moves from enquiry to fixed fixture |
| [RUNTIME-FLOW.md](RUNTIME-FLOW.md) | How auth, routing, services, Prisma, and external APIs fit together |

## Interview Talk Track

FixtureLog is a full-stack offshore shipbroking workflow demo. The core idea is not "a CRUD app"; it is an enquiry-to-fixture pipeline:

1. A broker or client creates a requirement.
2. The backend validates the payload with Zod.
3. Prisma persists structured domain records in Postgres.
4. The matching service ranks vessels with deterministic rules.
5. The fixture status policy controls negotiation states and subject gates.
6. The weather service adds real Open-Meteo evidence.
7. The recap formatter generates a deterministic SUPPLYTIME-style recap.
8. CI verifies the app with lint, typecheck, unit coverage, build, smoke, and E2E.

## The Sentence to Remember

FixtureLog keeps commercial truth in the database and service layer. The UI is a workflow surface; APIs enforce validation and auth; pure services hold the domain rules; Prisma/Postgres is the source of truth.
