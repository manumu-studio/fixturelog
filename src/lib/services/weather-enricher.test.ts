// Unit tests for the WeatherEnricher service — all fetch calls mocked, no live API

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchMarineWeather, clearWeatherCache } from './weather-enricher';

const validOpenMeteoResponse = {
  latitude: 57.15,
  longitude: -2.09,
  current: {
    time: '2026-06-12T10:00',
    wave_height: 1.5,
    swell_wave_height: 2.0,
    wind_wave_height: 0.8,
  },
};

beforeEach(() => {
  clearWeatherCache();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('fetchMarineWeather', () => {
  it('1: successful fetch — cache miss returns fromCache: false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    const result = await fetchMarineWeather(57.15, -2.09);

    expect(result.fromCache).toBe(false);
    expect(result.waveHeightM).toBe(1.5);
    expect(result.swellHeightM).toBe(2.0);
    expect(result.windWaveHeightM).toBe(0.8);
    expect(result.lat).toBe(57.15);
    expect(result.lng).toBe(-2.09);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it('2: cache hit — same coordinates returns fromCache: true; fetch called once', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    await fetchMarineWeather(57.15, -2.09);
    const second = await fetchMarineWeather(57.15, -2.09);

    expect(second.fromCache).toBe(true);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it('3: cache miss — different coordinates; fetch called twice', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    const r1 = await fetchMarineWeather(57.15, -2.09);
    const r2 = await fetchMarineWeather(58.97, 5.73);

    expect(r1.fromCache).toBe(false);
    expect(r2.fromCache).toBe(false);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });

  it('4: cache key rounding — nearby coords share an entry', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    // 57.154.toFixed(2) === "57.15", -2.091.toFixed(2) === "-2.09"
    // 57.152.toFixed(2) === "57.15", -2.093.toFixed(2) === "-2.09"  → same key
    await fetchMarineWeather(57.154, -2.091);
    const second = await fetchMarineWeather(57.152, -2.093);

    expect(second.fromCache).toBe(true);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it('5: TTL expiry — post-TTL call triggers fresh fetch', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    await fetchMarineWeather(57.15, -2.09);
    vi.advanceTimersByTime(300_001);
    const second = await fetchMarineWeather(57.15, -2.09);

    expect(second.fromCache).toBe(false);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });

  it('6: Zod rejects malformed upstream — missing current field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ latitude: 57.15, longitude: -2.09 }),
    });

    await expect(fetchMarineWeather(57.15, -2.09)).rejects.toThrow();
  });

  it('7: Zod rejects wrong types — current.wave_height is a string', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 57.15,
        longitude: -2.09,
        current: {
          time: '2026-06-12T10:00',
          wave_height: 'not_a_number',
          swell_wave_height: 2.0,
          wind_wave_height: 0.8,
        },
      }),
    });

    await expect(fetchMarineWeather(57.15, -2.09)).rejects.toThrow();
  });

  it('8: non-2xx upstream throws; response.json() not called', async () => {
    const jsonSpy = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: jsonSpy,
    });

    await expect(fetchMarineWeather(57.15, -2.09)).rejects.toThrow('503');
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('9: fetch timeout (abort) — rejects with AbortError', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation(
      (_url: string, opts?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const promise = fetchMarineWeather(57.15, -2.09);
    vi.advanceTimersByTime(10_001);

    await expect(promise).rejects.toThrow();
  });

  it('10: fetch network error — TypeError propagates', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network fail'));

    await expect(fetchMarineWeather(57.15, -2.09)).rejects.toThrow('network fail');
  });

  it('11: null swell and wind-wave in current — pass-through as null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 57.15,
        longitude: -2.09,
        current: {
          time: '2026-06-12T10:00',
          wave_height: 1.5,
          swell_wave_height: null,
          wind_wave_height: null,
        },
      }),
    });

    const result = await fetchMarineWeather(57.15, -2.09);
    expect(result.waveHeightM).toBe(1.5);
    expect(result.swellHeightM).toBeNull();
    expect(result.windWaveHeightM).toBeNull();
  });

  it('12: null current.wave_height defaults to 0 and verdict is WORKABLE', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 57.15,
        longitude: -2.09,
        current: {
          time: '2026-06-12T10:00',
          wave_height: null,
          swell_wave_height: null,
          wind_wave_height: null,
        },
      }),
    });

    const result = await fetchMarineWeather(57.15, -2.09);
    expect(result.waveHeightM).toBe(0);
    expect(result.workabilityVerdict).toBe('WORKABLE');
  });

  it('13: clearWeatherCache resets cache — next call is a cache miss', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validOpenMeteoResponse,
    });

    await fetchMarineWeather(57.15, -2.09);
    clearWeatherCache();
    const third = await fetchMarineWeather(57.15, -2.09);

    expect(third.fromCache).toBe(false);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });

  it('14: verdict integration — MARGINAL for wave:2.5 swell:3.2', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 57.15,
        longitude: -2.09,
        current: {
          time: '2026-06-12T10:00',
          wave_height: 2.5,
          swell_wave_height: 3.2,
          wind_wave_height: 1.5,
        },
      }),
    });

    const result = await fetchMarineWeather(57.15, -2.09);
    expect(result.workabilityVerdict).toBe('MARGINAL');
  });
});
