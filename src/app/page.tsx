// src/app/page.tsx — FixtureLog landing page (project overview + navigation)

const FEATURES: readonly string[] = [
  'Vessel tracking with seeded North Sea positions and provenance labels',
  'Charterer requirement capture and weighted FixtureMatcher shortlists',
  'Fixture lifecycle with enforced status transitions and subject-lift gating',
  'Marine weather enrichment and deterministic workability verdicts',
  'SUPPLYTIME 2017 recap generation from structured fixture terms',
];

const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/map', label: 'Regional Map' },
  { href: '/api/health', label: 'Health Check' },
  { href: '/api/vessels', label: 'Vessel API' },
  { href: '/api/fixtures', label: 'Fixture API' },
  { href: '/api/requirements', label: 'Requirement API' },
];

const TECH_STACK = 'Next.js 15 · Prisma 6 · PostgreSQL (Neon) · TypeScript (strict) · Zod';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', lineHeight: 1.6 }}>
      <h1>FixtureLog</h1>
      <p style={{ fontSize: '1.1rem' }}>Offshore vessel fixture management for shipbrokers.</p>

      <h2>What it does</h2>
      <ul>
        {FEATURES.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2>Explore</h2>
      <ul>
        {NAV_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>

      <h2>Tech stack</h2>
      <p>{TECH_STACK}</p>

      <footer style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
        Built as a portfolio project demonstrating offshore shipbroking domain expertise.
      </footer>
    </main>
  );
}
