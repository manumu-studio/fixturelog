// Normalization helpers for deterministic local sanctions screening.

export const SCREENING_TTL_HOURS = 24;

export function normalizeScreeningText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function isExpired(ttlExpiresAt: Date, checkedAt: Date): boolean {
  return ttlExpiresAt.getTime() <= checkedAt.getTime();
}
