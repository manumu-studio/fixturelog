// middleware.test.ts — verifies browser fallback redirects without changing API semantics.
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function request(pathname: string, method = 'GET') {
  return new NextRequest(`https://fixturelog.test${pathname}`, { method });
}

describe('middleware route fallback', () => {
  it('redirects unknown browser routes to the public landing', () => {
    const response = middleware(request('/does-not-exist'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://fixturelog.test/');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  it('lets known browser routes continue', () => {
    const response = middleware(request('/requirements/demo-id'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('keeps API routes on status-code semantics instead of redirecting', () => {
    const response = middleware(request('/api/requirements'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
