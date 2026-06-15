# Request Flow

How a user action becomes a validated FixtureLog response.

This graph uses the same mental model as the Helical request-flow document: browser state crosses a fetch boundary, the server validates the request, domain services perform deterministic work, Prisma reads or writes Postgres, and the response is validated/structured before the UI renders it.

```mermaid
sequenceDiagram
  participant U as User
  participant B as Browser / React UI
  participant A as Next.js App Router
  participant Auth as Auth.js session
  participant API as Route Handler
  participant Z as Zod validators
  participant S as Pure service layer
  participant DB as Prisma / Postgres
  participant WX as Open-Meteo

  U->>B: Clicks protected page or submits form
  B->>A: Navigate or fetch route
  A->>Auth: auth() checks JWT session
  alt anonymous page visitor
    Auth-->>A: no session
    A-->>B: redirect to public landing
  else anonymous API caller
    Auth-->>API: no session
    API-->>B: 401 JSON
  else authenticated
    Auth-->>A: session.user externalId/email/name
    A->>API: route handler receives request
    API->>Z: parse body/query/params
    alt invalid input
      Z-->>API: validation errors
      API-->>B: 400 JSON
    else valid input
      API->>DB: read/write domain records
      API->>S: run domain rule if needed
      opt weather evidence
        S->>WX: fetch marine data
        WX-->>S: current marine conditions
      end
      S-->>API: deterministic result
      API-->>B: JSON response
      B-->>U: render list/detail/map/status
    end
  end
```

## Example: Requirement Matching

```mermaid
flowchart TB
  UI[Requirement detail page] --> POST[POST /api/requirements/id/match]
  POST --> AUTH[requireApiSession]
  AUTH --> PARAMS[Validate id and optional weights]
  PARAMS --> LOAD[Load Requirement, Region, RateBenchmark, Vessels]
  LOAD --> MATCHER[FixtureMatcher pure service]
  MATCHER --> FILTER[Hard filters: type, region, DP, deck, bollard pull, status]
  FILTER --> SCORE[Weighted score: distance, rate fit, capability margin]
  SCORE --> STATUS{Requirement status is ENQUIRY?}
  STATUS -- yes --> SHORTLISTED[Persist status SHORTLISTED]
  STATUS -- no --> KEEP[Leave status unchanged]
  SHORTLISTED --> JSON[Return ranked shortlist]
  KEEP --> JSON
```

## Type Safety Chain

```mermaid
flowchart LR
  Form[FormData or JSON body] --> Z1[Zod request schema]
  Z1 --> Handler[Route handler]
  Handler --> Service[Typed service input]
  Service --> Prisma[Prisma model types]
  Prisma --> DB[(Postgres)]
  DB --> Handler
  Handler --> JSON[Structured JSON response]
  JSON --> UI[React server/client render]
```

## What to Say in the Interview

- "Every external boundary is parsed with Zod: body, query, route params, auth profile, and external weather payloads."
- "Route handlers own I/O. Pure services own domain decisions."
- "The matching engine does not know about HTTP or Prisma. That makes it easy to unit test."
- "Protected APIs return 401 JSON; protected pages redirect to the public landing."
- "Write routes derive the broker actor from the session, not from the request body."
