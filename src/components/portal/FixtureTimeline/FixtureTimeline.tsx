// FixtureTimeline.tsx — dashboard zone 3 (and My Fixtures): the charterer's fixtures with
// status, open subjects, and the latest weather verdict + honesty/source label. Server
// component shared by the dashboard and the My Fixtures page.
import { PortalCard } from '@/components/portal/PortalCard';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { EmptyState } from '@/components/portal/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { FixtureSummary } from '@/lib/validators/portal.validators';
import type { FixtureTimelineProps } from './FixtureTimeline.types';
import styles from './FixtureTimeline.module.css';

function WeatherLine({ weather }: { weather: FixtureSummary['weather'] }) {
  if (weather === null) {
    return <p className={styles.weatherNone}>No weather snapshot yet.</p>;
  }
  return (
    <p className={styles.weather}>
      <span className={styles.weatherVerdict}>{weather.verdict.replace(/_/g, ' ')}</span>
      <span className={styles.weatherMeta}>
        {weather.source} · updated {formatDate(weather.fetchedAt)}
      </span>
    </p>
  );
}

function FixtureItem({
  fixture,
  renderFixtureActions,
}: {
  fixture: FixtureSummary;
  renderFixtureActions?: FixtureTimelineProps['renderFixtureActions'];
}) {
  return (
    <li className={styles.item}>
      <div className={styles.itemHead}>
        <span className={styles.vessel}>{fixture.vesselName}</span>
        <span className={styles.type}>{fixture.vesselType}</span>
        <StatusBadge status={fixture.status} />
      </div>
      <div className={styles.meta}>
        <span>{fixture.regionName}</span>
        <span>{formatMoney(fixture.agreedDayRate, fixture.currency)}/day</span>
        {fixture.commencement !== null && <span>Commences {formatDate(fixture.commencement)}</span>}
      </div>
      {fixture.subjects.length > 0 && (
        <ul className={styles.subjects}>
          {fixture.subjects.map((s) => (
            <li key={s.id} className={styles.subject}>
              <span className={styles.subjectLabel}>{s.label}</span>
              <StatusBadge status={s.status} />
            </li>
          ))}
        </ul>
      )}
      <WeatherLine weather={fixture.weather} />
      {/* Broker-only slot: charterer call sites omit the prop → nothing renders. */}
      {renderFixtureActions?.(fixture)}
    </li>
  );
}

export function FixtureTimeline({
  fixtures,
  emptyMessage,
  renderFixtureActions,
}: FixtureTimelineProps) {
  return (
    <PortalCard>
      <h2 className={styles.heading}>Fixtures &amp; weather</h2>
      {fixtures.length === 0 ? (
        <EmptyState
          title="No fixtures yet"
          message={emptyMessage ?? 'Your fixtures will appear here once an enquiry is fixed.'}
        />
      ) : (
        <ul className={styles.list}>
          {fixtures.map((fixture) => (
            <FixtureItem
              key={fixture.id}
              fixture={fixture}
              renderFixtureActions={renderFixtureActions}
            />
          ))}
        </ul>
      )}
    </PortalCard>
  );
}
