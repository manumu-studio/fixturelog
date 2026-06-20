// Shared types for deterministic sanctions/operator-risk screening services.

export type ScreeningSubjectType = 'VESSEL' | 'OWNER' | 'OPERATOR' | 'CHARTERER';
export type ScreeningStatus = 'CLEAR' | 'REVIEW' | 'BLOCKED';
export type ScreeningMatchType = 'IMO_EXACT' | 'NAME_EXACT' | 'NAME_REVIEW' | 'NONE';
export type ScreeningReviewAction =
  | 'REVIEWED'
  | 'ESCALATED'
  | 'CANNOT_PROCEED'
  | 'REVIEW_CLEARED';

export type FixtureStatusForGate =
  | 'DRAFT'
  | 'NEGOTIATING'
  | 'ON_SUBS'
  | 'FIXED'
  | 'COMPLETED'
  | 'FAILED';

export interface ScreenableSubject {
  id: string;
  subjectType: ScreeningSubjectType;
  name: string;
  country?: string | null;
  sector?: string | null;
  imo?: string | null;
  mmsi?: string | null;
  flagState?: string | null;
}

export interface ScreeningResultSnapshot {
  id: string;
  subjectType: ScreeningSubjectType;
  subjectId: string;
  subjectName: string;
  status: ScreeningStatus;
  reason: string;
  screenedAt: Date;
  ttlExpiresAt: Date;
  sourceName: string;
  sourceListName: string;
  sourceListVersion: string;
  sourceJurisdiction?: string | null;
  sourceListDate?: Date | null;
  sourceRecordId?: string | null;
  sourceRecordUrl?: string | null;
  matchedName?: string | null;
  matchedIdentifier?: string | null;
  matchType?: ScreeningMatchType;
}

export interface ScreeningGateInput {
  checkedAt: Date;
  results: ScreeningResultSnapshot[];
}

export type ScreeningGateOutcome =
  | { allowed: true }
  | { allowed: false; reason: string };

export type ScreeningReviewOutcome =
  | { allowed: true }
  | { allowed: false; reason: string };
