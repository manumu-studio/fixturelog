// MockPanels.tsx — CSS-rendered representative preview panels for each feature row.
// These are honest illustrations of each route's layout and data shape.
// No real screenshots: seeded data is explicitly labelled; no live AIS implied.

import styles from './FeatureShowcase.module.css';

// ---------------------------------------------------------------------------
// Requirements panel — represents /requirements list + shortlist evidence
// ---------------------------------------------------------------------------

const REQ_ROWS = [
  { label: 'NSR-001 · AHTS, DP2 · NEGOTIATING', score: '91%' },
  { label: 'NSR-002 · PSV, 3000DWT · ENQUIRY', score: '74%' },
  { label: 'NSR-003 · Standby, <500GT · ON_SUBS', score: '68%' },
] as const;

export function RequirementsPanel() {
  return (
    <div className={styles.mockPanel} aria-hidden="true">
      <div className={styles.mockPanelBar}>
        <span className={styles.mockPanelTitle}>Requirements</span>
        <span className={styles.mockSeedBadge}>Seeded data</span>
      </div>
      <ul className={styles.mockList}>
        {REQ_ROWS.map((row) => (
          <li key={row.label} className={styles.mockListItem}>
            <span className={styles.mockListLabel}>{row.label}</span>
            <span className={styles.mockScore}>{row.score}</span>
          </li>
        ))}
      </ul>
      <div className={styles.mockEvidenceRow}>
        <span className={styles.mockEvidenceChip}>Hard filters</span>
        <span className={styles.mockEvidenceChip}>Distance score</span>
        <span className={styles.mockEvidenceChip}>Rate fit</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map panel — represents /map Leaflet chart with seeded vessel dots
// ---------------------------------------------------------------------------

const VESSEL_DOTS = [
  { top: '28%', left: '42%', label: 'MV Cormorant', type: 'AHTS' },
  { top: '48%', left: '62%', label: 'MV Puffin', type: 'PSV' },
  { top: '62%', left: '35%', label: 'MV Gannet', type: 'Standby' },
  { top: '38%', left: '75%', label: 'MV Kittiwake', type: 'AHTS' },
] as const;

export function MapPanel() {
  return (
    <div className={styles.mockPanel} aria-hidden="true">
      <div className={styles.mockPanelBar}>
        <span className={styles.mockPanelTitle}>North Sea — Regional Map</span>
        <span className={styles.mockSeedBadge}>Seeded positions</span>
      </div>
      <div className={styles.mockMapArea}>
        <div className={styles.mockMapGrid} />
        {VESSEL_DOTS.map((v) => (
          <div
            key={v.label}
            className={styles.mockVesselDot}
            style={{ top: v.top, left: v.left }}
            title={`${v.label} (${v.type})`}
          >
            <div className={styles.mockDotCore} />
            <span className={styles.mockDotLabel}>{v.label}</span>
          </div>
        ))}
        <span className={styles.mockMapNote}>UKCS / Norwegian sectors · synthetic positions</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle panel — represents fixture status flow with subject-lift gate
// ---------------------------------------------------------------------------

const STATUS_STEPS = [
  { label: 'ENQUIRY', done: true },
  { label: 'NEGOTIATING', done: true },
  { label: 'ON_SUBS', done: true },
  { label: 'FIXED', done: false },
] as const;

export function LifecyclePanel() {
  return (
    <div className={styles.mockPanel} aria-hidden="true">
      <div className={styles.mockPanelBar}>
        <span className={styles.mockPanelTitle}>Fixture Lifecycle</span>
        <span className={styles.mockSeedBadge}>API-enforced</span>
      </div>
      <div className={styles.mockStatusFlow}>
        {STATUS_STEPS.map((step, i) => (
          <div key={step.label} className={styles.mockStatusStep}>
            <div className={step.done ? styles.mockStatusDotDone : styles.mockStatusDotPending} />
            <span className={step.done ? styles.mockStatusLabelDone : styles.mockStatusLabelPending}>
              {step.label}
            </span>
            {i < STATUS_STEPS.length - 1 && <div className={styles.mockStatusConnector} />}
          </div>
        ))}
      </div>
      <div className={styles.mockSubjectBox}>
        <p className={styles.mockSubjectHeading}>Subject-lift gate</p>
        <div className={styles.mockSubjectItems}>
          <span className={styles.mockSubjectItem}>Laycan confirmed</span>
          <span className={styles.mockSubjectItem}>Weather window</span>
          <span className={styles.mockSubjectItemPending}>Commercial approval pending</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weather + Recap panel — represents Open-Meteo verdict + SUPPLYTIME recap
// ---------------------------------------------------------------------------

export function WeatherRecapPanel() {
  return (
    <div className={styles.mockPanel} aria-hidden="true">
      <div className={styles.mockPanelBar}>
        <span className={styles.mockPanelTitle}>Weather + Recap</span>
        <span className={styles.mockSeedBadge}>Open-Meteo · deterministic</span>
      </div>
      <div className={styles.mockWeatherRow}>
        <div className={styles.mockWeatherCard}>
          <span className={styles.mockWeatherLabel}>Wave height</span>
          <span className={styles.mockWeatherValue}>1.4 m</span>
          <span className={styles.mockWeatherVerdict}>Workable</span>
        </div>
        <div className={styles.mockWeatherCard}>
          <span className={styles.mockWeatherLabel}>Wind speed</span>
          <span className={styles.mockWeatherValue}>12 kn</span>
          <span className={styles.mockWeatherVerdict}>Workable</span>
        </div>
      </div>
      <div className={styles.mockRecapBox}>
        <p className={styles.mockRecapHeading}>SUPPLYTIME 2017 Recap</p>
        <p className={styles.mockRecapLine}>Vessel: MV Cormorant (AHTS, DP2)</p>
        <p className={styles.mockRecapLine}>Laycan: 15 Jun – 18 Jun 2026</p>
        <p className={styles.mockRecapLine}>Rate: USD 18,500 /day</p>
        <p className={styles.mockRecapNote}>Generated from structured terms — not AI</p>
      </div>
    </div>
  );
}
