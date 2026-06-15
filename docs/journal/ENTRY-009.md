# ENTRY-009 — Client Portal + Broker Dashboard (the two-sided product)

**Date:** 2026-06-14
**Type:** Feature (PACKET-009)
**Version:** v1.3.0
**Branch:** `feat/client-portal`

## Summary

FixtureLog stops being a broker-only workspace. PACKET-009 adds a **charterer Client Portal** (`/portal/*`) and a **broker Dashboard** (`/dashboard`), both authenticated and role-gated on top of PACKET-008's `AppUser` identity. A logged-in charterer can answer *what have I requested, what is happening now, what needs my decision* — and act (create an enquiry, browse the fleet, track fixtures and documents). A broker lands on a real home (the broker-wide queue) instead of the bare `/requirements` list.

## Why the portal precedes (and replaces) the AI copilot

The original roadmap had the AI Broker Copilot next. We built the client surface first because it is the product a paying customer actually sees, and it is deterministic and testable. During this packet the copilot was **dropped** entirely — the two-sided portal/dashboard is the product direction, so there is no AI runtime to sequence after it.

## Key decisions

- **One identity, two roles.** `AppUser` now maps an OIDC identity to *either* a `Broker` (role BROKER) *or* a `Charterer` (role CLIENT). `resolve-role` / `resolve-home-route` + a `/api/auth/post-login` hop send each role to its home (charterer → `/portal`, broker → `/dashboard`). Each guard (`require-charterer`, `require-broker`) bounces the other role.
- **Broker home is `/dashboard`, not `/requirements`.** The broker dashboard reuses the *same* `DashboardData` shape and the *same* portal components as the charterer dashboard — the only new code is a broker-wide query (no `chartererId` filter) and the page wiring.
- **Charterer scoping is the security spine.** Every portal read/write derives `chartererId` from the session, never from a body or query. Cross-charterer reads 404; brokers get 403; anonymous 401 — all proven by test.
- **Honesty over realism for vessel images.** Rather than hot-link photographer-owned ShipSpotting/MarineTraffic images, each vessel gets a committed per-type SVG illustration labelled truthfully (`imageSource = STOCK`, `imageCredit` stating it is a representative illustration, not a photo of the named vessel).
- **Real vessel photos lead the fleet view.** `/map` orders vessels with real/attributed photos first (`WIKIMEDIA`, `OPERATOR`, `EXTERNAL`) and pushes stock/no-image vessels to the end, keeping the gallery useful without hiding fallback art.
- **Fleet actions are actor-aware.** The shared `/map` surface is available to brokers and clients, but the vessel modal only shows `Use in enquiry` for clients; brokers get vessel intelligence without client-only CTAs.
- **Token-only design kit, no fork.** A shared `src/components/portal/` kit (`PortalShell`, `PortalNav`, `PortalButton`, `PortalCard`, `StatusBadge`, `EmptyState`, `Modal`, `Lightbox`) is composed by every surface and the broker dashboard. `PortalNav` is parameterized (broker vs charterer items) rather than duplicated. The landing `AuthCta` was refactored off hardcoded hex onto `--fl-*` tokens so the landing and portal share one button language.
- **Demo seed tells a story.** The dev auto-link targets Equinor, who now has a full arc (shortlisted enquiry + ON_SUBS fixture with subjects/marginal weather + FIXED fixture with recap/workable weather), so a charterer login is not an empty dashboard.

## Files touched (high level)

- Schema + migration `client_portal` (vessel images + `AppRole`/`chartererId`), seed (images + demo arc).
- `src/lib/auth/` — `require-charterer`, `require-broker`, `resolve-role`, `resolve-home-route` (+ tests).
- `src/lib/services/portal/` — charterer queries, broker queries, shortlist, mappers.
- `src/app/portal/*`, `src/app/(app)/dashboard/*`, `src/app/api/portal/*`, `src/app/api/broker/dashboard`, `src/app/api/auth/post-login`.
- `src/components/portal/*` (design kit + dashboard zones), `src/features/fleet-explorer/*`, `src/features/enquiry/*`.
- Landing reconciliation: `AuthCta` (tokens + role-aware link), `FleetTeaser`, `page.tsx`.

## Verification

typecheck ✓ · lint ✓ · **331 unit tests** (49 files) ✓ · **production build** ✓ · **e2e 7/7** ✓ · `npm audit` full + prod **0 vulnerabilities** ✓.
