// Unit tests for the pure role mapper: charterer -> /portal, broker -> /dashboard.
import { describe, it, expect } from 'vitest';
import { resolveRole } from './resolve-role';

describe('resolveRole', () => {
  it('sends a linked charterer to the portal', () => {
    expect(resolveRole({ role: 'CLIENT', brokerId: null, chartererId: 'ch-1' })).toEqual({
      role: 'CLIENT',
      homeRoute: '/portal',
    });
  });

  it('sends a CLIENT role to the portal even without a charterer link', () => {
    expect(resolveRole({ role: 'CLIENT', brokerId: null, chartererId: null })).toEqual({
      role: 'CLIENT',
      homeRoute: '/portal',
    });
  });

  it('sends a broker to the dashboard', () => {
    expect(resolveRole({ role: 'BROKER', brokerId: 'br-1', chartererId: null })).toEqual({
      role: 'BROKER',
      homeRoute: '/dashboard',
    });
  });

  it('defaults an unprovisioned broker-role user to the dashboard', () => {
    expect(resolveRole({ role: 'BROKER', brokerId: null, chartererId: null })).toEqual({
      role: 'BROKER',
      homeRoute: '/dashboard',
    });
  });
});
