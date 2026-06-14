// Unit tests for the server env schema + production secret guard.
import { describe, expect, it } from 'vitest';
import {
  DEV_NEXTAUTH_SECRET,
  DEV_PLACEHOLDER,
  parseServerEnv,
} from './env.server.schema';

const REAL_SECRET = 'x'.repeat(40);

describe('parseServerEnv', () => {
  it('applies dev placeholders when auth vars are absent (development)', () => {
    const env = parseServerEnv({ NODE_ENV: 'development' });
    expect(env.AUTH_CLIENT_ID).toBe(DEV_PLACEHOLDER);
    expect(env.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
    expect(env.AUTH_ISSUER_URL).toBe('https://auth.manumustudio.com');
  });

  it('throws when NEXTAUTH_SECRET is shorter than 32 chars', () => {
    expect(() => parseServerEnv({ NEXTAUTH_SECRET: 'too-short' })).toThrow();
  });

  it('throws in production when auth secrets are still placeholders', () => {
    expect(() => parseServerEnv({ NODE_ENV: 'production' })).toThrow(
      /production auth secrets/i,
    );
  });

  it('does not throw in production when real secrets are provided', () => {
    const env = parseServerEnv({
      NODE_ENV: 'production',
      AUTH_CLIENT_ID: 'real-client-id',
      AUTH_CLIENT_SECRET: 'real-client-secret',
      NEXTAUTH_SECRET: REAL_SECRET,
    });
    expect(env.AUTH_CLIENT_ID).toBe('real-client-id');
  });

  it('skips the production guard in CI even with placeholders', () => {
    const env = parseServerEnv({ NODE_ENV: 'production', CI: 'true' });
    expect(env.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
  });
});
