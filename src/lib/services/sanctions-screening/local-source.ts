// Local normalized sanctions fixture adapter. This is a deterministic demo source with the
// same parse boundary future yente/direct-government adapters will use.
import { z } from 'zod';
import type { ScreeningSubjectType } from './sanctions-screening.types';

const SUBJECT_TYPE_SCHEMA = z.enum(['VESSEL', 'OWNER', 'OPERATOR', 'CHARTERER']);
const STATUS_SCHEMA = z.enum(['CLEAR', 'REVIEW', 'BLOCKED']);

const LocalScreeningRecordSchema = z.object({
  recordId: z.string().min(1),
  subjectTypes: z.array(SUBJECT_TYPE_SCHEMA).min(1),
  names: z.array(z.string().min(1)).min(1),
  imos: z.array(z.string().min(1)).default([]),
  status: STATUS_SCHEMA,
  sourceName: z.string().min(1),
  sourceJurisdiction: z.string().min(1).nullable(),
  sourceListName: z.string().min(1),
  sourceListVersion: z.string().min(1),
  sourceListDate: z.coerce.date().nullable(),
  sourceRecordUrl: z.string().url().nullable(),
  reason: z.string().min(1),
});

export type LocalScreeningRecord = z.infer<typeof LocalScreeningRecordSchema>;

const LOCAL_RECORDS_INPUT = [
  {
    recordId: 'local-vessel-umka-9171620',
    subjectTypes: ['VESSEL'],
    names: ['UMKA'],
    imos: ['9171620'],
    status: 'BLOCKED',
    sourceName: 'FixtureLog local sanctions fixture',
    sourceJurisdiction: 'US',
    sourceListName: 'Demo maritime sanctions fixture',
    sourceListVersion: '2026-06-20-local',
    sourceListDate: '2026-06-20T00:00:00.000Z',
    sourceRecordUrl: null,
    reason: 'Local fixture marks this vessel IMO as a true BLOCKED demo hit.',
  },
  {
    recordId: 'local-vessel-artemis-offshore-9747194',
    subjectTypes: ['VESSEL'],
    names: ['ARTEMIS OFFSHORE'],
    imos: ['9747194'],
    status: 'BLOCKED',
    sourceName: 'FixtureLog local sanctions fixture',
    sourceJurisdiction: 'US',
    sourceListName: 'Demo maritime sanctions fixture',
    sourceListVersion: '2026-06-20-local',
    sourceListDate: '2026-06-20T00:00:00.000Z',
    sourceRecordUrl: null,
    reason: 'Local fixture marks this vessel IMO as a true BLOCKED demo hit.',
  },
  {
    recordId: 'local-operator-marine-rescue-service',
    subjectTypes: ['OPERATOR'],
    names: ['MARINE RESCUE SERVICE', 'MORSPAS'],
    imos: [],
    status: 'BLOCKED',
    sourceName: 'FixtureLog local sanctions fixture',
    sourceJurisdiction: 'US',
    sourceListName: 'Demo maritime sanctions fixture',
    sourceListVersion: '2026-06-20-local',
    sourceListDate: '2026-06-20T00:00:00.000Z',
    sourceRecordUrl: null,
    reason: 'Local fixture marks this operator name as a true BLOCKED demo hit.',
  },
] satisfies unknown[];

export function loadLocalScreeningRecords(): LocalScreeningRecord[] {
  return z.array(LocalScreeningRecordSchema).parse(LOCAL_RECORDS_INPUT);
}

export function recordAppliesTo(
  record: LocalScreeningRecord,
  subjectType: ScreeningSubjectType,
): boolean {
  return record.subjectTypes.includes(subjectType);
}
