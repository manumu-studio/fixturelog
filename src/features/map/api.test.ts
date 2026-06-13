// Unit tests for the vessel-positions fetch helper
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchVesselPositions } from './api';

const ITEM = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx01', name: 'Nordic Hawk', vesselType: 'PSV', status: 'OPEN',
  ownerName: 'Offshore Fleet Ltd', lat: 57.1, lng: 1.8, portName: 'Aberdeen', source: 'SEEDED', confidence: 'HIGH',
};

afterEach(() => { vi.unstubAllGlobals(); });

describe('fetchVesselPositions', () => {
  it('returns the parsed data array on a valid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [ITEM] }) }));
    await expect(fetchVesselPositions()).resolves.toEqual([ITEM]);
  });

  it('throws when the response shape is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ wrong: true }) }));
    await expect(fetchVesselPositions()).rejects.toThrow();
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(fetchVesselPositions()).rejects.toThrow();
  });
});
