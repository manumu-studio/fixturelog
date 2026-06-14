// Tests for the auth-aware landing CTA (anonymous vs authenticated branches).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode, AnchorHTMLAttributes } from 'react';
import type { Session } from 'next-auth';

vi.mock('@/features/auth/auth', () => ({ auth: vi.fn(), signIn: vi.fn() }));
vi.mock('next/link', () => {
  function MockLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
    return <a href={href} {...rest}>{children}</a>;
  }
  return { default: MockLink };
});

import { AuthCta } from './AuthCta';
import { auth } from '@/features/auth/auth';

const SESSION: Session = {
  user: { externalId: 'ext-1', email: null, name: null, image: null },
  expires: new Date(Date.now() + 60_000).toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthCta — anonymous', () => {
  it('renders Sign in and Create account, not Go to Workspace', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const html = renderToStaticMarkup(await AuthCta({ variant: 'nav' }));

    expect(html).toContain('Sign in');
    expect(html).toContain('Create account');
    expect(html).not.toContain('Go to Workspace');
  });
});

describe('AuthCta — authenticated', () => {
  it('renders Go to Workspace linking to /requirements', async () => {
    vi.mocked(auth).mockResolvedValue(SESSION);

    const html = renderToStaticMarkup(await AuthCta({ variant: 'hero' }));

    expect(html).toContain('Go to Workspace');
    expect(html).toContain('href="/requirements"');
    expect(html).not.toContain('Create account');
  });
});
