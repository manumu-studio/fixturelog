// portal-mappers.ts — pure Prisma-row -> portal DTO mappers (PACKET-009 §T5).
// No I/O: each function turns a fetched row into the serialisable shape the API
// validates and returns. Date values emit ISO strings.
import type {
  CharterType, Currency, DPClass, FixtureStatus, RegionCode, RequirementStatus,
  SubjectItemStatus, VesselStatus, VesselType,
} from '@prisma/client';
import type { MatchResult } from '@/lib/services/fixture-matcher.types';
import type {
  EnquirySummary, FixtureSummary, PortalDocument, ShortlistEntry,
} from '@/lib/validators/portal.validators';

const iso = (d: Date | null): string | null => (d === null ? null : d.toISOString());

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
  };
}

export interface FixtureRow {
  id: string;
  status: FixtureStatus;
  agreedDayRate: number;
  currency: Currency;
  commencement: Date | null;
  durationDays: number | null;
  vessel: { name: string; vesselType: VesselType };
  region: { name: string };
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
  };
}
