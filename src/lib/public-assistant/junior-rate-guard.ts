// junior-rate-guard.ts — abuse + cost ceiling for the public junior LLM demo.
// A visitor gets JUNIOR_COOKIE_LIMIT questions per 12h window; the request IP is a coarser backstop
// (higher limit) so clearing cookies cannot grant unlimited tries, without hard-blocking colleagues
// behind one NAT'd IP. In-memory Map is acceptable for a short-lived single-instance demo (a restart
// or a second instance resets counters — noted, by design, not production rate-limiting).
import 'server-only';

export const JUNIOR_COOKIE_LIMIT = 3;
export const JUNIOR_IP_LIMIT = 12;
export const JUNIOR_WINDOW_MS = 12 * 60 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateKey {
  readonly key: string;
  readonly limit: number;
}

export interface RateDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSec: number;
}

// Consume one hit against every key; blocked if ANY key is now over its limit. remaining reflects
// the tightest key (the per-visitor cookie in the normal case). now is injectable for tests.
export function checkJuniorRateLimit(
  keys: readonly RateKey[],
  now: number = Date.now(),
): RateDecision {
  let allowed = true;
  let remaining = Number.POSITIVE_INFINITY;
  let retryAfterMs = 0;

  for (const { key, limit } of keys) {
    const existing = store.get(key);
    const bucket: Bucket =
      existing === undefined || now >= existing.resetAt
        ? { count: 0, resetAt: now + JUNIOR_WINDOW_MS }
        : existing;
    bucket.count += 1;
    store.set(key, bucket);

    remaining = Math.min(remaining, Math.max(0, limit - bucket.count));
    if (bucket.count > limit) {
      allowed = false;
      retryAfterMs = Math.max(retryAfterMs, bucket.resetAt - now);
    }
  }

  return {
    allowed,
    remaining: Number.isFinite(remaining) ? remaining : 0,
    retryAfterSec: Math.ceil(retryAfterMs / 1000),
  };
}

// Test helper — clears the in-memory store between tests.
export function __resetJuniorRateStore(): void {
  store.clear();
}
