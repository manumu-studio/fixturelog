// Tests for haversineNm — great-circle distance in nautical miles

import { describe, expect, it } from 'vitest';
import { haversineNm } from './haversine';

describe('haversineNm', () => {
  it('Aberdeen to Stavanger: ~270–300 nm (±10 nm)', () => {
    const result = haversineNm(57.15, -2.09, 58.97, 5.73);
    expect(result).toBeGreaterThanOrEqual(260);
    expect(result).toBeLessThanOrEqual(310);
  });

  it('London to New York: ~3000 nm (±50 nm)', () => {
    const result = haversineNm(51.51, -0.13, 40.71, -74.01);
    expect(result).toBeGreaterThanOrEqual(2950);
    expect(result).toBeLessThanOrEqual(3050);
  });

  it('same point: returns exactly 0', () => {
    const result = haversineNm(57.15, -2.09, 57.15, -2.09);
    expect(result).toBe(0);
  });

  it('equator crossing (1° N to 1° S along 0° meridian): ~120 nm (±5 nm)', () => {
    const result = haversineNm(1.0, 0.0, -1.0, 0.0);
    expect(result).toBeGreaterThanOrEqual(115);
    expect(result).toBeLessThanOrEqual(125);
  });

  it('antipodal points (0,0) → (0,180): ~10800 nm (±50 nm)', () => {
    const result = haversineNm(0, 0, 0, 180);
    expect(result).toBeGreaterThanOrEqual(10750);
    expect(result).toBeLessThanOrEqual(10850);
  });

  it('returns a number rounded to 2 decimal places', () => {
    const result = haversineNm(51.51, -0.13, 40.71, -74.01);
    const decimals = result.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
