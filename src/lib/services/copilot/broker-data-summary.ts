// broker-data-summary.ts — turns the broker's live dashboard aggregate into a compact,
// labeled, plain-text block that is injected into the copilot's system prompt as its ONLY
// source of truth. This is the grounding layer: the model can only answer from what appears
// here, so the formatting is deliberately explicit (numbered items, named fields, IDs) so the
// model can cite real records and never has to invent shape. Read-only, no LLM involved.
import 'server-only';
import type {
  Dashboard, EnquirySummary, FixtureSummary, PendingAction,
} from '@/lib/validators/portal.validators';

function formatEnquiry(e: EnquirySummary, i: number): string {
  const rate = e.dayRateBudget !== null ? `${e.dayRateBudget}/day budget` : 'no budget given';
  const end = e.endDate ?? 'open';
  const screeningSource = e.screening.source ?? 'no source';
  const lines = [
    `[E${i}] Enquiry ${e.id} — ${e.vesselTypeNeeded} in ${e.regionName}`,
    `  status: ${e.status}; charter: ${e.charterType}; workscope: ${e.workscopeName}`,
    `  dates: ${e.startDate} → ${end}; rate: ${rate}`,
    `  screening: ${e.screening.status}; ${e.screening.reason}; source: ${screeningSource}; screenedAt: ${e.screening.screenedAt ?? 'never'}; ttlExpiresAt: ${e.screening.ttlExpiresAt ?? 'n/a'}`,
  ];
  if (e.notes !== null) {
    lines.push(`  notes: ${e.notes}`);
  }
  return lines.join('\n');
}

function formatFixture(f: FixtureSummary, i: number): string {
  const open = f.subjects.filter((s) => s.status === 'PENDING');
  const subjectText = f.subjects.length === 0
    ? 'none'
    : f.subjects.map((s) => `${s.label} (${s.status})`).join(', ');
  const weather = f.weather !== null ? `${f.weather.verdict} (as of ${f.weather.fetchedAt})` : 'no reading';
  const screeningSource = f.screening.source ?? 'no source';
  return [
    `[F${i}] Fixture ${f.id} — ${f.vesselName} (${f.vesselType}) in ${f.regionName}`,
    `  status: ${f.status}; agreed rate: ${f.agreedDayRate} ${f.currency}; commencement: ${f.commencement ?? 'TBC'}`,
    `  open subjects: ${open.length}; subjects: ${subjectText}`,
    `  screening: ${f.screening.status}; ${f.screening.reason}; source: ${screeningSource}; screenedAt: ${f.screening.screenedAt ?? 'never'}; ttlExpiresAt: ${f.screening.ttlExpiresAt ?? 'n/a'}`,
    `  weather: ${weather}`,
  ].join('\n');
}

function formatAction(a: PendingAction, i: number): string {
  const due = a.dueAt !== null ? `; due ${a.dueAt}` : '';
  return `[A${i}] ${a.kind}: ${a.label}${due}`;
}

function section<T>(title: string, items: T[], format: (item: T, i: number) => string): string {
  if (items.length === 0) {
    return `${title}: (none)`;
  }
  const body = items.map((item, idx) => format(item, idx + 1)).join('\n');
  return `${title} (${items.length}):\n${body}`;
}

// Build the full grounding block. The `counts` line states the totals up front so the model
// can answer "how many" questions without re-counting the (possibly capped) lists below.
export function buildBrokerDataSummary(dashboard: Dashboard): string {
  const { activeEnquiries, timeline, pendingActions, counts } = dashboard;
  return [
    `CURRENT BROKER DATA (live, as of this request)`,
    `Totals: ${counts.enquiries} requirement(s), ${counts.fixtures} in-progress fixture(s), ${counts.openSubjects} open subject(s).`,
    ``,
    section('OPEN ENQUIRIES', activeEnquiries, formatEnquiry),
    ``,
    section('IN-PROGRESS FIXTURES', timeline, formatFixture),
    ``,
    section('PENDING ACTIONS (decisions waiting on you)', pendingActions, formatAction),
  ].join('\n');
}
