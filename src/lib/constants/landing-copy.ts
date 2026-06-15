// landing-copy.ts — single source of truth for all landing page copy.
// All landing section components read from this module; no copy is hard-coded elsewhere.

import { BRAND_NAME } from './brand';

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

export const LANDING_NAV_LINKS = [
  { href: '/requirements', label: 'Requirements' },
  { href: '/map', label: 'Regional Map' },
  { href: '/charterers', label: 'Charterers' },
] as const;

export type LandingNavLink = (typeof LANDING_NAV_LINKS)[number];

// Public/anonymous landing nav — marketing-safe links only. Requirements and
// Charterers are authenticated broker pages and must NOT appear here for logged-out
// visitors. The Regional Map is kept as a public teaser. The authenticated broker nav
// (PortalNav / PRIMARY_NAV_LINKS) still uses LANDING_NAV_LINKS above.
export const PUBLIC_NAV_LINKS = [
  { href: '/map', label: 'Regional Map' },
] as const;

export type PublicNavLink = (typeof PUBLIC_NAV_LINKS)[number];

// Real auth CTA labels — wired to Auth.js server actions via the AuthCta component.
export const LANDING_AUTH_CTA = {
  signIn: 'Sign in',
  signUp: 'Create account',
  workspace: 'Go to Workspace',
} as const;

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

// Explicit element type so an empty utilityLinks array still resolves to a link
// shape (not `never`) for the components that map over it.
export interface HeroUtilityLink {
  readonly label: string;
  readonly href: string;
}

const HERO_UTILITY_LINKS: readonly HeroUtilityLink[] = [];

export const LANDING_HERO_COPY = {
  eyebrow: 'Offshore Fixture Workflow Demo',
  headline: "From enquiry to recap, the broker's workflow made legible.",
  subline:
    `${BRAND_NAME} models the full SUPPLYTIME fixture cycle — vessel matching, subject-lift gating, weather evidence, and recap generation — on a seeded North Sea fleet.`,
  primaryCta: { label: 'Explore Requirements', href: '/requirements' },
  secondaryCta: { label: 'View Regional Map', href: '/map' },
  // Public landing hero utility strip — authenticated/dev links (Charterers, Add Charterer,
  // Health) removed so the logged-out page exposes no broker-only routes.
  utilityLinks: HERO_UTILITY_LINKS,
  // Retained only for the untracked page2 WIP hero variant; the shipped landing (LandingHero)
  // no longer renders this teaser — it shows the real AuthCta instead.
  authTeaser: 'Sign in coming next — no account required to explore.',
} as const;

export type LandingHeroCopy = typeof LANDING_HERO_COPY;

// ---------------------------------------------------------------------------
// Proof strip (real numbers from MVP v1.0.0)
// ---------------------------------------------------------------------------

export const LANDING_PROOF_POINTS = [
  { value: '22', label: 'Domain API endpoints' },
  { value: '264', label: 'Unit tests' },
  { value: '4', label: 'E2E specs' },
  { value: 'North Sea', label: 'Seeded vessel fleet' },
  { value: 'Open-Meteo', label: 'Live weather evidence' },
] as const;

export type LandingProofPoint = (typeof LANDING_PROOF_POINTS)[number];

// ---------------------------------------------------------------------------
// Fleet teaser (client story — public preview that funnels to the portal Fleet Explorer)
// ---------------------------------------------------------------------------

export const LANDING_FLEET_TEASER = {
  eyebrow: 'For charterers',
  heading: 'Explore the fleet, then post your enquiry',
  subline:
    'Charterers get their own portal: browse every vessel on the map and in the gallery, open one for its specs, and turn it into an enquiry — then track your fixture through to recap.',
  creditNote:
    'Illustrations representative of each vessel type — not photographs of specific vessels.',
  cta: { label: 'Sign in to explore the fleet', href: '/portal/fleet' },
  vessels: [
    { type: 'PSV', label: 'Platform Supply', image: '/assets/vessels/psv.svg' },
    { type: 'AHTS', label: 'Anchor Handling', image: '/assets/vessels/ahts.svg' },
    { type: 'CSV', label: 'Construction Support', image: '/assets/vessels/csv.svg' },
    { type: 'DSV', label: 'Dive Support', image: '/assets/vessels/dsv.svg' },
  ],
} as const;

export type LandingFleetTeaser = typeof LANDING_FLEET_TEASER;

// ---------------------------------------------------------------------------
// Feature showcase — 4 sections
// ---------------------------------------------------------------------------

export const LANDING_FEATURES = [
  {
    id: 'requirements',
    eyebrow: 'Capture + Match',
    heading: 'Requirement capture with weighted vessel shortlists',
    body: 'Enter a charterer requirement — duration, cargo type, laycan, and geography. FixtureMatcher scores every seeded vessel against hard filters and weighted criteria, returning a ranked shortlist in milliseconds.',
    cta: { label: 'Browse requirements', href: '/requirements' },
    imageAlt: 'Requirements list and matching panel',
  },
  {
    id: 'map',
    eyebrow: 'Regional Map',
    heading: 'North Sea fleet positions at a glance',
    body: 'Seeded vessel positions are rendered on a Leaflet map with provenance labels so it is always clear which data is synthetic and which is live. Port nodes and vessel tracks reflect the modelled UKCS and Norwegian sectors.',
    cta: { label: 'Open map', href: '/map' },
    imageAlt: 'Regional North Sea vessel map',
  },
  {
    id: 'lifecycle',
    eyebrow: 'Fixture Lifecycle',
    heading: 'Enforced status transitions with subject-lift gating',
    body: 'Fixtures move through ENQUIRY → NEGOTIATING → ON_SUBS → FIXED. Subject items — laycan confirmation, weather window, commercial approval — must be lifted or waived before a fixture can be fixed. The gate is enforced at the API layer.',
    cta: { label: 'View requirements', href: '/requirements' },
    imageAlt: 'Fixture lifecycle and subject-lift panel',
  },
  {
    id: 'recap',
    eyebrow: 'Weather + Recap',
    heading: 'Marine weather evidence and SUPPLYTIME 2017 recap',
    body: `Open-Meteo wave and wind data is fetched, evaluated against workability thresholds, and persisted as timestamped evidence. On fixture close, ${BRAND_NAME} generates a deterministic SUPPLYTIME 2017 recap from structured terms.`,
    cta: { label: 'Explore requirements', href: '/requirements' },
    imageAlt: 'Weather workability verdict and recap output',
  },
] as const;

export type LandingFeature = (typeof LANDING_FEATURES)[number];

export const LANDING_FEATURE_SECTION_HEADING = `What ${BRAND_NAME} models` as const;

// ---------------------------------------------------------------------------
// How it works — 4 steps
// ---------------------------------------------------------------------------

export const LANDING_HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    phase: 'Capture',
    heading: 'Log the charterer and requirement',
    body: 'Record the client company and their offshore requirement: vessel type, duration, cargo category, laycan window, and operational area.',
  },
  {
    step: 2,
    phase: 'Match',
    heading: 'Score and shortlist vessels',
    body: 'FixtureMatcher applies hard eligibility filters then ranks remaining vessels by weighted criteria. The broker receives a scored shortlist with match rationale.',
  },
  {
    step: 3,
    phase: 'Fix',
    heading: 'Work the fixture to completion',
    body: 'Create a fixture from a shortlisted vessel, negotiate terms, lift subjects, confirm weather windows, and advance the fixture through each lifecycle stage.',
  },
  {
    step: 4,
    phase: 'Recap',
    heading: 'Generate the SUPPLYTIME 2017 recap',
    body: `Once a fixture is fixed, ${BRAND_NAME} generates a structured recap from the agreed terms — vessel, laycan, duration, rate, and special conditions — in SUPPLYTIME 2017 format.`,
  },
] as const;

export type HowItWorksStep = (typeof LANDING_HOW_IT_WORKS_STEPS)[number];

// ---------------------------------------------------------------------------
// Tech badges
// ---------------------------------------------------------------------------

export const LANDING_TECH_BADGES = [
  { label: 'Next.js 15' },
  { label: 'TypeScript strict' },
  { label: 'Prisma 6' },
  { label: 'PostgreSQL / Neon' },
  { label: 'Zod' },
  { label: 'Leaflet' },
  { label: 'Open-Meteo' },
  { label: 'Playwright' },
  { label: 'Vercel' },
] as const;

export type TechBadge = (typeof LANDING_TECH_BADGES)[number];

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

export const LANDING_CTA_FOOTER = {
  heading: 'Enter the broker workspace',
  subline: 'Sign in to work the live fixture workflow. All vessel data is synthetic and seeded for the demo.',
  links: [
    { label: 'View Requirements', href: '/requirements' },
    { label: 'Regional Map', href: '/map' },
    { label: 'Add Charterer', href: '/charterers/new' },
    { label: 'Health Check', href: '/api/health' },
  ],
} as const;

export type LandingCtaFooter = typeof LANDING_CTA_FOOTER;

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const LANDING_FOOTER_COPY = {
  disclaimer:
    `${BRAND_NAME} is an independent portfolio project demonstrating offshore shipbroking domain expertise. It is not affiliated with, endorsed by, or produced by SSY Global or any commercial broking firm. All vessel data is synthetic and seeded for demonstration purposes only.`,
  // Public footer links — broker-only routes (Requirements, Charterers) removed so the
  // logged-out landing exposes only the public map teaser and the health endpoint.
  links: [
    { label: 'Regional Map', href: '/map' },
    { label: 'Health API', href: '/api/health' },
  ],
  copyright: `© ${new Date().getFullYear()} ${BRAND_NAME} — Portfolio Demo`,
} as const;

export type LandingFooterCopy = typeof LANDING_FOOTER_COPY;
