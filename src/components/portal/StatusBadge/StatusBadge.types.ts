// Props for the shared status pill consumed by every portal surface (requirement,
// fixture, and subject statuses). Tone is derived from the status string.
export type StatusTone = 'new' | 'active' | 'done' | 'lost';

export interface StatusBadgeProps {
  status: string;
}
