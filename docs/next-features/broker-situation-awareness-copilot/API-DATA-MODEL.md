# API And Data Model

## New Enum Candidates

```prisma
enum SignalDigestState {
  NO_NEW_SIGNAL
  HEADS_UP
  NEEDS_BROKER_ATTENTION
  SOURCE_UNAVAILABLE
}

enum SignalSourceKind {
  INTERNAL
  OFFICIAL
  TRUSTED_NEWS
  OPEN_MEDIA
  SOCIAL
  WEATHER
  PORT
  AIS
}

enum SignalConfidence {
  LOW
  MEDIUM
  HIGH
}

enum SignalMatchedEntityType {
  VESSEL
  OPERATOR
  OWNER
  CHARTERER
  PORT
  ROUTE
  REGION
}
```

## New Table Candidates

```prisma
model SignalDigest {
  id          String            @id @default(cuid())
  fixtureId   String
  fixture     Fixture           @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  state       SignalDigestState
  windowHours Int
  summary     String
  reviewedAt  DateTime?
  reviewedBy  String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  evidence    SignalEvidence[]

  @@index([fixtureId, createdAt])
  @@index([state, createdAt])
}

model SignalEvidence {
  id                String                  @id @default(cuid())
  digestId          String
  digest            SignalDigest            @relation(fields: [digestId], references: [id], onDelete: Cascade)
  sourceName        String
  sourceKind        SignalSourceKind
  sourceUrl         String?
  sourcePublishedAt DateTime?
  fetchedAt         DateTime
  matchedEntityType SignalMatchedEntityType
  matchedEntityName String
  confidence        SignalConfidence
  isOfficial        Boolean                 @default(false)
  title             String
  snippet           String
  query             String
  rawHash           String?
  createdAt         DateTime                @default(now())

  @@index([sourceKind, fetchedAt])
  @@index([matchedEntityType, matchedEntityName])
}
```

## Fixture Relation

Add to `Fixture`:

```prisma
signalDigests SignalDigest[]
```

## API Endpoints

### Refresh Situation Digest

```http
POST /api/fixtures/[id]/situation-digest
```

Access: broker only.

Request:

```json
{
  "windowHours": 72
}
```

Validation:

- `windowHours` optional
- allowed values: `24`, `48`, `72`
- default: `72`

Response:

```json
{
  "data": {
    "id": "clx_digest_1",
    "fixtureId": "fixture_123",
    "state": "HEADS_UP",
    "windowHours": 72,
    "summary": "Two recent media signals mention disruption near the route. No official source confirmed a hard stop.",
    "createdAt": "2026-07-06T10:00:00.000Z",
    "evidence": [
      {
        "id": "clx_evidence_1",
        "sourceName": "GDELT",
        "sourceKind": "OPEN_MEDIA",
        "sourceUrl": "https://example.com/news",
        "sourcePublishedAt": "2026-07-06T08:30:00.000Z",
        "matchedEntityType": "PORT",
        "matchedEntityName": "Aberdeen",
        "confidence": "MEDIUM",
        "title": "Port disruption reported near Aberdeen",
        "snippet": "Local report mentions delays...",
        "isOfficial": false
      }
    ]
  }
}
```

### Read Latest Situation Digest

```http
GET /api/fixtures/[id]/situation-digest
```

Access: broker only.

Response:

```json
{
  "data": {
    "latest": {
      "id": "clx_digest_1",
      "state": "HEADS_UP",
      "summary": "Two recent media signals mention disruption near the route.",
      "createdAt": "2026-07-06T10:00:00.000Z",
      "evidenceCount": 2
    }
  }
}
```

### Mark Digest Reviewed

```http
POST /api/fixtures/[id]/situation-digest/[digestId]/review
```

Access: broker only.

Request:

```json
{
  "note": "Reviewed before moving fixture forward. Broker considers the signal not material."
}
```

Response:

```json
{
  "data": {
    "id": "clx_digest_1",
    "reviewedAt": "2026-07-06T10:15:00.000Z",
    "reviewedBy": "broker_123"
  }
}
```

## Zod Schemas

Create `src/lib/validators/situation-digest.validators.ts`:

```ts
import { z } from 'zod';

export const RefreshSituationDigestRequestSchema = z.object({
  windowHours: z.union([z.literal(24), z.literal(48), z.literal(72)]).default(72),
});

export const ReviewSituationDigestRequestSchema = z.object({
  note: z.string().min(1).max(500),
});

export const SourceEvidenceSchema = z.object({
  sourceName: z.string().min(1),
  sourceKind: z.enum(['official', 'trusted_news', 'open_media', 'social', 'weather', 'port']),
  title: z.string().min(1),
  url: z.string().url().nullable(),
  publishedAt: z.coerce.date().nullable(),
  fetchedAt: z.coerce.date(),
  matchedEntityType: z.enum(['vessel', 'operator', 'owner', 'charterer', 'port', 'route', 'region']),
  matchedEntityName: z.string().min(1),
  snippet: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high']),
  isOfficial: z.boolean(),
  query: z.string().min(1),
});
```

## UI DTO

```ts
export interface SituationDigestSummary {
  id: string;
  state: 'NO_NEW_SIGNAL' | 'HEADS_UP' | 'NEEDS_BROKER_ATTENTION' | 'SOURCE_UNAVAILABLE';
  summary: string;
  createdAt: string;
  reviewedAt: string | null;
  evidence: SituationEvidenceSummary[];
}

export interface SituationEvidenceSummary {
  id: string;
  sourceName: string;
  sourceKind: string;
  title: string;
  sourceUrl: string | null;
  sourcePublishedAt: string | null;
  matchedEntityType: string;
  matchedEntityName: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  isOfficial: boolean;
}
```
