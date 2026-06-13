// Unit tests for GET /api/weather/marine — validates params, delegates to enricher, returns ad-hoc snapshot
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services/weather-enricher', () => ({
  fetchMarineWeather: vi.fn(),
}));

import { GET } from './route';
import { fetchMarineWeather } from '@/lib/services/weather-enricher';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(query: string): NextRequest {
  return new NextRequest(
    new Request(`http://localhost/api/weather/marine${query}`),
  );
}

const MOCK_ENRICHMENT = {
  lat: 57.12,
  lng: -2.05,
  waveHeightM: 1.5,
  swellHeightM: 2.0,
  windWaveHeightM: 0.8,
  workabilityVerdict: 'WORKABLE' as const,
  fetchedAt: new Date('2026-06-12T10:00:00Z'),
  fromCache: false,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/weather/marine', () => {
  it('valid lat/lng → 200 with fixtureId null, no id key, verdict present', async () => {
    vi.mocked(fetchMarineWeather).mockResolvedValue(MOCK_ENRICHMENT);

    const res = await GET(makeRequest('?lat=57.12&lng=-2.05'));
    const json = await res.json() as { data: Record<string, unknown> };

    expect(res.status).toBe(200);
    expect(json.data.fixtureId).toBeNull();
    expect('id' in json.data).toBe(false);
    const verdict = json.data['workabilityVerdict'];
    expect(['WORKABLE', 'MARGINAL', 'NOT_WORKABLE']).toContain(verdict);
  });

  it('missing lat (?lng=5) → 400, enricher not called', async () => {
    const res = await GET(makeRequest('?lng=5'));
    expect(res.status).toBe(400);
    expect(vi.mocked(fetchMarineWeather)).not.toHaveBeenCalled();
  });

  it('empty lat (?lat=&lng=5) → 400, enricher not called', async () => {
    const res = await GET(makeRequest('?lat=&lng=5'));
    expect(res.status).toBe(400);
    expect(vi.mocked(fetchMarineWeather)).not.toHaveBeenCalled();
  });

  it('non-numeric lat (?lat=abc&lng=5) → 400, enricher not called', async () => {
    const res = await GET(makeRequest('?lat=abc&lng=5'));
    expect(res.status).toBe(400);
    expect(vi.mocked(fetchMarineWeather)).not.toHaveBeenCalled();
  });

  it('out-of-range lat (?lat=999&lng=5) → 400, enricher not called', async () => {
    const res = await GET(makeRequest('?lat=999&lng=5'));
    expect(res.status).toBe(400);
    expect(vi.mocked(fetchMarineWeather)).not.toHaveBeenCalled();
  });

  it('enricher throws (Open-Meteo unreachable) → 502 with error message', async () => {
    vi.mocked(fetchMarineWeather).mockRejectedValue(new Error('fetch failed'));

    const res = await GET(makeRequest('?lat=57.12&lng=-2.05'));
    const json = await res.json() as { error: string };

    expect(res.status).toBe(502);
    expect(json.error).toBe('Weather service unavailable');
  });
});
