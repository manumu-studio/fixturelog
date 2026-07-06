# Company Workflow From Charterer Enquiry

This document explains the business workflow that FixtureLog models. It starts when a charterer
creates an enquiry and ends with a broker-owned recap and audit trail.

The presentation angle is the sanctions pivot: I am not claiming the app is compliance AI. I built a
deterministic workflow guard around the risk moment. The app stores evidence, asks for human review,
and blocks unsafe state changes before `FIXED`.

## ASCII Workflow

```text
1. Charterer creates enquiry
   Charterer portal
     -> POST /api/portal/enquiries
     -> Requirement in Neon

2. Broker receives the requirement
   Broker dashboard / requirements queue
     -> Requirement + Charterer + Region + Workscope

3. System builds a shortlist
   FixtureMatcher service
     -> Vessel
     -> PositionSnapshot
     -> RateBenchmark
     -> ranked shortlist

4. Broker negotiates the fixture
   Broker workflow
     -> Fixture
     -> FixtureStatusChange
     -> SubjectItem

5. Screening evidence is stored
   Sanctions screening service
     -> Vessel
     -> Owner
     -> Operator
     -> Charterer
     -> ScreeningResult
     -> optional ScreeningReview

6. Weather evidence is stored
   WeatherEnricher service
     -> Open-Meteo Marine
     -> WeatherSnapshot

7. Broker moves ON_SUBS to FIXED
   Fixture status API
     -> subject gate
     -> fresh screening gate
     -> true BLOCKED cannot be overridden
     -> Fixture status becomes FIXED only if rules pass

8. Recap is generated
   RecapFormatter service
     -> Fixture
     -> Vessel
     -> Charterer
     -> Owner / Operator context
     -> Recap

9. Evidence remains auditable
   Neon Postgres
     -> Requirement
     -> Fixture
     -> FixtureStatusChange
     -> ScreeningResult
     -> ScreeningReview
     -> WeatherSnapshot
     -> Recap
```

## Stage Explanations

### 1. Charterer Creates The Enquiry

A charterer enters the requirement from the portal. The API **validates** the input at the boundary,
which means it checks the data where it enters the system. Then it persists a `Requirement` row in
Neon with the charterer, region, workscope, laycan, vessel type, and budget context.

What I say:

> I start with the charterer enquiry because that is the commercial trigger. I validate the data at
> the API boundary, then I persist it as a `Requirement`.

### 2. Broker Receives The Requirement

The broker dashboard reads the incoming requirement queue. This is the shared brokerage view. It joins
the `Requirement` with `Charterer`, `Region`, and `Workscope`, so the broker can see who needs the
vessel, where the work is, and what kind of vessel is required.

What I say:

> The broker does not start from an empty screen. The requirement lands in the queue with the client
> and work context already attached.

### 3. System Builds A Shortlist

The matcher reads the requirement, available vessels, latest position snapshots, and rate benchmarks.
It produces a ranked shortlist. This is commercial evidence, not clearance. The broker can see why a
vessel scored well, but the app does not make the final decision for them.

What I say:

> Matching is deterministic. I can explain the score because it comes from vessel fit, location, and
> rate context. It is a shortlist, not an automatic fixture.

### 4. Broker Negotiates The Fixture

When a vessel becomes a real candidate, the broker creates or works a `Fixture`. The fixture moves
through statuses and subjects. Each status move writes a `FixtureStatusChange`, so the timeline shows
how the deal moved.

What I say:

> The fixture is where the enquiry becomes an active deal. I keep the status changes separate because
> the broker needs an audit trail.

### 5. Screening Evidence Is Stored

The sanctions/operator-risk slice screens the charterer, vessel, owner, and operator. It writes
immutable `ScreeningResult` rows with source, list version, reason, timestamp, and 24-hour freshness.
`REVIEW` needs broker review. A true `BLOCKED` result cannot be broker-overridden.

What I say:

> This is the pivot. I am not saying the app gives legal advice. I am saying it stores deterministic
> evidence and enforces the rule before the broker fixes the deal.

### 6. Weather Evidence Is Stored

The weather service calls Open-Meteo Marine and stores a `WeatherSnapshot`. This gives the broker a
work-window signal such as `WORKABLE`, `MARGINAL`, or `NOT_WORKABLE`.

What I say:

> Weather is another evidence layer. It helps the broker see operational risk before committing.

### 7. Broker Moves `ON_SUBS` To `FIXED`

This is the most important gate. Before `FIXED`, the backend checks subjects and screening freshness.
If subjects are unresolved, screening is stale, source data failed, review is unresolved, or a true
`BLOCKED` result exists, the API rejects the transition.

The service **enforces** the rule, which means it makes the rule impossible to skip through the UI or
the copilot.

What I say:

> The important part is that the rule lives on the backend. The UI can show warnings, but the API is
> the authority. Even an approved copilot action must pass the same gate.

### 8. Recap Is Generated

After the fixture is safe to summarize, the recap service builds the commercial recap from stored
fixture data. It uses the fixture, vessel, charterer, owner/operator context, region, workscope, and
main terms.

What I say:

> The recap is not free text from a model. It is generated from the stored fixture terms, so it is
> repeatable and easier to audit.

### 9. Evidence Remains Auditable

The important tables remain available after the deal moves forward: `Requirement`, `Fixture`,
`FixtureStatusChange`, `ScreeningResult`, `ScreeningReview`, `WeatherSnapshot`, and `Recap`. This
lets me explain not only what happened, but why the system allowed or blocked the next step.

What I say:

> The value is the audit trail. I can show the enquiry, the shortlist, the fixture status, the
> screening result, the weather snapshot, and the recap.

## Interview Framing

Use this short version if the interviewer asks for the whole system:

> FixtureLog starts with a charterer enquiry. I validate it, persist it in Neon, and let the broker
> build a vessel shortlist. When that becomes a fixture, the app tracks subjects, weather, screening
> evidence, status changes, and the recap. The key point is the `FIXED` gate. The app does not give
> legal advice. It enforces deterministic rules and keeps a human broker in the decision.

## What This Proves

| Skill area | What the workflow demonstrates |
|---|---|
| React + TypeScript | Role-specific portal and broker surfaces over the same domain workflow. |
| Node.js APIs | Thin route handlers with validation, guards, and service delegation. |
| PostgreSQL / Neon | Domain-shaped tables with relationships and audit evidence. |
| REST design | Route families map to real workflow stages, not random CRUD. |
| Testing mindset | The risky transition, `ON_SUBS -> FIXED`, is testable because the gate is deterministic. |
| AI-first judgment | The copilot can explain stored evidence, but it cannot clear risk or bypass backend rules. |

## Must-Rehearse Terms

- **validate**: "I validate the data at the boundary before I persist it."
- **enforce**: "The backend enforces the `FIXED` gate, so the UI and copilot cannot skip it."
