// format.ts — shared display formatters for portal surfaces. Inputs are the ISO strings
// and nullable numbers the portal DTOs emit; output is human-readable, en-GB.

export function formatDate(iso: string | null): string {
  if (iso === null) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(value: number | null, currency?: string): string {
  if (value === null) return '—';
  const amount = value.toLocaleString('en-GB');
  return currency !== undefined ? `${amount} ${currency}` : amount;
}

export function formatRate(value: number | null, currency?: string): string {
  if (value === null) return 'Budget TBC';
  return `${formatMoney(value, currency)}/day`;
}
