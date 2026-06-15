# PR — v1.3.0 — Client Portal + Broker Dashboard (PACKET-009)

**Branch:** `feat/client-portal` → `main`
**Type:** Feature (minor release — adds a new authenticated audience; no breaking change to the broker workflow)

## What this PR does

Turns FixtureLog into a **two-sided product**: a charterer **Client Portal** at `/portal/*` and a broker **Dashboard** at `/dashboard`, both role-gated on PACKET-008's `AppUser` identity.

### Charterer Client Portal (`/portal/*`)
- **Dashboard** — active enquiries, pending actions (what needs the client's decision), and a fixture/weather timeline with the workability verdict + honesty/source label.
- **Create Enquiry** — deterministic, Zod-validated form; writes a `Requirement` owned by the session charterer (`status: ENQUIRY`); supports a "Use in enquiry" prefill from a vessel.
- **My Enquiries** + detail — the charterer's requirements, and a per-requirement **recommended-vessel shortlist** that reuses the PACKET-003 matcher read-only with "why this vessel" evidence.
- **My Fixtures** + **Documents** — the charterer's fixtures (status, subjects, weather) and recap documents (copy / download).
- **Fleet Explorer components** — the reused Leaflet map (extended with an optional `onVesselClick`) plus a vessel gallery and a shared `VesselModal`; a map marker and a gallery card open the same modal.
- **Fleet ordering** — `/map` sorts real-photo vessels first and places stock/no-image vessels at the end of the gallery/map data.
- **Actor-aware vessel actions** — clients see `Use in enquiry`; brokers do not see client-only enquiry CTAs or copy.

### Broker Dashboard (`/dashboard`)
- The same three dashboard zones, fed by a **broker-wide** aggregate (every charterer's queue), reusing the portal component kit unchanged. Broker home moved from the bare `/requirements` list to `/dashboard`.

### Identity, scoping, and design system
- `AppUser` gains `role` (BROKER | CLIENT) + `chartererId`; a `/api/auth/post-login` hop routes each role home. `require-charterer` / `require-broker` guards each bounce the other role.
- Charterer-scoped `/api/portal/*` (401 anonymous, 403 broker, 404 cross-charterer) and broker-wide `/api/broker/dashboard` (403 charterer); every response Zod-validated.
- Token-only `src/components/portal/` design kit; `AuthCta` refactored onto `--fl-*` tokens; honesty-labelled per-type vessel illustrations.

## Why it was needed

FixtureLog only spoke to brokers. A two-sided demo (client + broker) is the product story, and it is deterministic and testable — no runtime LLM. The AI Broker Copilot was dropped in favour of this direction.

## How to verify

```bash
npm run typecheck && npm run lint && npm run test   # 343 unit tests, 52 files
npm run test:coverage                               # 79.03 / 72.97 / 72.14 / 79.03
npm run build                                         # all /portal/* + /dashboard routes compile
npm run test:e2e                                      # 7/7
npm audit --audit-level=high && npm audit --omit=dev --audit-level=high   # 0 vulnerabilities
```

Manual (dev): sign in → a charterer lands on `/portal` (the demo charterer Equinor shows a full arc: enquiries, an ON_SUBS fixture with subjects + marginal weather, a FIXED fixture with a recap); a broker lands on `/dashboard` with the broker-wide queue. A broker hitting `/portal` is bounced to `/dashboard`; a charterer hitting `/dashboard` is bounced to `/portal`; an anonymous visitor hitting either is sent to `/`. Requesting another charterer's enquiry id returns 404.

## Deployment notes

1. Run the `client_portal` Prisma migration (additive: new nullable columns + enums + index + FK; non-destructive).
2. Reseed / refresh vessel images (committed SVGs under `public/assets/vessels/`; real-photo vessels appear first on `/map`, stock/no-image vessels sort last).
3. Ensure at least one production `Charterer.contactEmail` is set so a real client links on first login (dev auto-links the demo charterer).
4. Deploy; verify `/api/health`, charterer login → `/portal`, broker login → `/dashboard`, create-enquiry, and the vessel map.

Rollback: portal/dashboard routes are additive; reverting the deploy restores the broker-only build. Keep the `client_portal` migration (unused columns are safer than a destructive down-migration).
