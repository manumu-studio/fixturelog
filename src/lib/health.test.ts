// src/lib/health.test.ts — unit test for health check helper
import { describe, it, expect } from 'vitest';
import { checkHealth } from './health';

describe('checkHealth', () => {
  it('returns ok when the query succeeds', async () => {
    const result = await checkHealth(async () => [{ '?column?': 1 }]);
    expect(result).toEqual({ status: 'ok' });
  });

  it('returns degraded when the query throws', async () => {
    const result = await checkHealth(async () => {
      throw new Error('connection refused');
    });
    expect(result).toEqual({ status: 'degraded', reason: 'database unreachable' });
  });
});
