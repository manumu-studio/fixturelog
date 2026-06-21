// junior-rate-guard.test.ts — the per-visitor / per-IP demo rate limit (now is injected, no clock).
import { describe, expect, it, beforeEach } from 'vitest';
import {
  checkJuniorRateLimit,
  __resetJuniorRateStore,
  JUNIOR_COOKIE_LIMIT,
  JUNIOR_WINDOW_MS,
} from './junior-rate-guard';

const cookie = (id: string) => ({ key: `c:${id}`, limit: JUNIOR_COOKIE_LIMIT });

beforeEach(() => {
  __resetJuniorRateStore();
});

describe('junior rate guard', () => {
  it('allows up to the cookie limit, then blocks with a retry-after', () => {
    const now = 1_000_000;
    for (let i = 0; i < JUNIOR_COOKIE_LIMIT; i += 1) {
      expect(checkJuniorRateLimit([cookie('v1')], now).allowed).toBe(true);
    }
    const blocked = checkJuniorRateLimit([cookie('v1')], now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('resets once the 12h window elapses', () => {
    const now = 1_000_000;
    for (let i = 0; i <= JUNIOR_COOKIE_LIMIT; i += 1) checkJuniorRateLimit([cookie('v2')], now);
    expect(checkJuniorRateLimit([cookie('v2')], now).allowed).toBe(false);
    expect(checkJuniorRateLimit([cookie('v2')], now + JUNIOR_WINDOW_MS + 1).allowed).toBe(true);
  });

  it('blocks when ANY key is over its limit (IP backstop catches cookie-clearers)', () => {
    const now = 5_000;
    // Fresh cookies but the shared IP key (limit 1 here) blocks the second visitor.
    expect(checkJuniorRateLimit([{ key: 'c:a', limit: 5 }, { key: 'ip:x', limit: 1 }], now).allowed).toBe(true);
    expect(checkJuniorRateLimit([{ key: 'c:b', limit: 5 }, { key: 'ip:x', limit: 1 }], now).allowed).toBe(false);
  });

  it('remaining reflects the tightest key', () => {
    const now = 9_000;
    expect(checkJuniorRateLimit([{ key: 'c:r', limit: 3 }, { key: 'ip:r', limit: 12 }], now).remaining).toBe(2);
  });
});
