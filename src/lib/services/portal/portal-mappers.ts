// portal-mappers.ts — pure Prisma-row -> portal DTO mappers.
// No I/O: each function turns a fetched row into the serialisable shape the API
// validates and returns. Date values emit ISO strings.
import type {
  CharterType, Currency, DPClass, FixtureStatus, RegionCode, RequirementStatus,
  ScreeningStatus, SubjectItemStatus, VesselStatus, VesselType,
} from '@prisma/client';
import type { MatchResult } from '@/lib/services/fixture-matcher.types';
import type {
  EnquirySummary, FixtureSummary, PortalDocument, ScreeningBadge, ShortlistEntry,
} from '@/lib/validators/portal.validators';

const iso = (d: Date | null): string | null => (d === null ? null : d.toISOString());

interface ScreeningCacheRow {
  latestScreeningStatus: ScreeningStatus | null;
  latestScreenedAt: Date | null;
  latestScreeningTtlExpiresAt: Date | null;
  latestScreeningSourceName: string | null;
}

function toScreeningBadge(cache: Partial<ScreeningCacheRow> | null | undefined): ScreeningBadge {
  const status = cache?.latestScreeningStatus ?? null;
  const ttlExpiresAt = cache?.latestScreeningTtlExpiresAt ?? null;
  const screenedAt = cache?.latestScreenedAt ?? null;
  if (status === null) {
    return {
      status: 'NOT_SCREENED',
      screenedAt: null,
      ttlExpiresAt: null,
      source: null,
      reason: 'Not screened',
    };
  }
  const stale = ttlExpiresAt !== null && ttlExpiresAt.getTime() <= Date.now();
  return {
    status: stale ? 'STALE' : status,
    screenedAt: iso(screenedAt),
    ttlExpiresAt: iso(ttlExpiresAt),
    source: cache?.latestScreeningSourceName ?? null,
    reason: stale ? 'Re-screen required' : `Latest result: ${status}`,
  };
}

function screeningSeverity(status: ScreeningBadge['status']): number {
  const severity: Record<ScreeningBadge['status'], number> = {
    BLOCKED: 5,
    SOURCE_ERROR: 4,
    STALE: 3,
    REVIEW: 2,
    NOT_SCREENED: 1,
    CLEAR: 0,
  };
  return severity[status];
}

function rollupScreeningBadges(
  caches: Array<Partial<ScreeningCacheRow> | null | undefined>,
): ScreeningBadge {
  const badges = caches.map(toScreeningBadge);
  const [first, ...rest] = badges;
  if (first === undefined) return toScreeningBadge(null);
  return rest.reduce(
    (worst, badge) => (
      screeningSeverity(badge.status) > screeningSeverity(worst.status) ? badge : worst
    ),
    first,
  );
}

export interface RequirementRow {
  id: string;
  status: RequirementStatus;
  vesselTypeNeeded: VesselType;
  charterType: CharterType;
  startDate: Date;
  endDate: Date | null;
  durationDays: number | null;
  dayRateBudget: number | null;
  notes: string | null;
  createdAt: Date;
  region: { name: string; code: RegionCode };
  workscope: { name: string };
  charterer?: ScreeningCacheRow | null;
}

export function toEnquirySummary(req: RequirementRow): EnquirySummary {
  return {
    id: req.id,
    status: req.status,
    vesselTypeNeeded: req.vesselTypeNeeded,
    regionName: req.region.name,
    regionCode: req.region.code,
    workscopeName: req.workscope.name,
    charterType: req.charterType,
    startDate: req.startDate.toISOString(),
    endDate: iso(req.endDate),
    durationDays: req.durationDays,
    dayRateBudget: req.dayRateBudget,
    notes: req.notes,
    createdAt: req.createdAt.toISOString(),
    screening: toScreeningBadge(req.charterer),
  };
}

export interface FixtureRow {
  id: string;
  status: FixtureStatus;
  agreedDayRate: number;
  currency: Currency;
  commencement: Date | null;
  durationDays: number | null;
  vessel: { name: string; vesselType: VesselType } & Partial<ScreeningCacheRow>;
  region: { name: string };
  charterer?: ScreeningCacheRow | null;
  subjects: { id: string; label: string; status: SubjectItemStatus; dueAt: Date | null; owner: string | null }[];
  weatherSnapshots: { workabilityVerdict: string; fetchedAt: Date }[];
}

export function toFixtureSummary(fx: FixtureRow): FixtureSummary {
  const latestWeather = fx.weatherSnapshots[0] ?? null;
  return {
    id: fx.id,
    vesselName: fx.vessel.name,
    vesselType: fx.vessel.vesselType,
    status: fx.status,
    regionName: fx.region.name,
    agreedDayRate: fx.agreedDayRate,
    currency: fx.currency,
    commencement: iso(fx.commencement),
    durationDays: fx.durationDays,
    subjects: fx.subjects.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      dueAt: iso(s.dueAt),
      owner: s.owner,
    })),
    weather:
      latestWeather === null
        ? null
        : {
            verdict: latestWeather.workabilityVerdict,
            fetchedAt: latestWeather.fetchedAt.toISOString(),
            source: 'Open-Meteo Marine (seeded)',
          },
    screening: rollupScreeningBadges([fx.vessel, fx.charterer]),
  };
}

export interface RecapRow {
  id: string;
  version: number;
  approvedByBrokerId: string | null;
  createdAt: Date;
  generatedMarkdown: string;
  generatedText: string;
  fixture: { vessel: { name: string } };
  fixtureId: string;
}

export function toDocument(recap: RecapRow): PortalDocument {
  return {
    id: recap.id,
    fixtureId: recap.fixtureId,
    vesselName: recap.fixture.vessel.name,
    version: recap.version,
    isFinal: recap.approvedByBrokerId !== null,
    createdAt: recap.createdAt.toISOString(),
    generatedMarkdown: recap.generatedMarkdown,
    generatedText: recap.generatedText,
  };
}

export interface ShortlistVesselRow {
  id: string;
  vesselType: VesselType;
  dpClass: DPClass;
  deckAreaM2: number | null;
  bollardPullT: number | null;
  status: VesselStatus;
  imageUrl: string | null;
  latestScreeningStatus?: ScreeningStatus | null;
  latestScreenedAt?: Date | null;
  latestScreeningTtlExpiresAt?: Date | null;
  latestScreeningSourceName?: string | null;
}

// Combine a matcher result with the candidate vessel's specs for "why this vessel".
export function toShortlistEntry(result: MatchResult, vessel: ShortlistVesselRow): ShortlistEntry {
  return {
    vesselId: result.vesselId,
    vesselName: result.vesselName,
    vesselType: vessel.vesselType,
    dpClass: vessel.dpClass,
    deckAreaM2: vessel.deckAreaM2,
    bollardPullT: vessel.bollardPullT,
    status: vessel.status,
    imageUrl: vessel.imageUrl,
    score: result.score,
    rank: result.rank,
    factors: result.factors,
    screening: toScreeningBadge(vessel),
  };
}
