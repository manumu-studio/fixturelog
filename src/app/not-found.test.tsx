// not-found.test.tsx — verifies unknown browser routes return to the public landing.
import { describe, expect, it, vi } from 'vitest';
import NotFound from './not-found';

vi.mock('next/navigation', () => ({
  redirect: (href: string) => {
    throw new Error(`REDIRECT:${href}`);
  },
}));

describe('global not found route', () => {
  it('redirects unknown browser routes to the public landing', () => {
    expect(() => NotFound()).toThrow('REDIRECT:/');
  });
});
