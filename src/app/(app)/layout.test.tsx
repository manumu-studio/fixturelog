// layout.test.tsx — authenticated app shell tests. Every (app) route should render
// through the shared navbar shell, with nav items selected by session home route.
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/auth/require-session', () => ({ requireSession: vi.fn() }));
vi.mock('@/lib/auth/resolve-home-route', () => ({ resolveHomeRoute: vi.fn() }));
vi.mock('@/components/portal/PortalShell', () => {
  function PortalShell({
    user,
    children,
    navItems,
    homeHref,
    brandSub,
  }: {
    user: { name: string | null; email: string | null };
    children: ReactNode;
    navItems: { label: string; href: string }[];
    homeHref: string;
    brandSub: string;
  }) {
    return (
      <section data-brand-sub={brandSub} data-home-href={homeHref} data-user-name={user.name ?? ''}>
        <nav>{navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
        {children}
      </section>
    );
  }
  return { PortalShell };
});

import AppLayout from './layout';
import { requireSession } from '@/lib/auth/require-session';
import { resolveHomeRoute } from '@/lib/auth/resolve-home-route';

const USER = {
  externalId: 'auth-user-1',
  email: 'user@example.com',
  name: 'Avery Client',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireSession).mockResolvedValue(USER);
});

describe('(app) layout navbar', () => {
  it('renders the client navbar on client pages such as /map', async () => {
    vi.mocked(resolveHomeRoute).mockResolvedValue('/portal');

    const html = renderToStaticMarkup(await AppLayout({ children: <p>Map page</p> }));

    expect(html).toContain('data-brand-sub="Client Portal"');
    expect(html).toContain('data-home-href="/portal"');
    expect(html).toContain('href="/map"');
    expect(html).toContain('Available Vessels');
    expect(html).toContain('My Enquiries');
    expect(html).toContain('Map page');
  });

  it('renders the broker navbar on broker workspace pages', async () => {
    vi.mocked(resolveHomeRoute).mockResolvedValue('/dashboard');

    const html = renderToStaticMarkup(await AppLayout({ children: <p>Broker page</p> }));

    expect(html).toContain('data-brand-sub="Broker Workspace"');
    expect(html).toContain('data-home-href="/dashboard"');
    expect(html).toContain('href="/requirements"');
    expect(html).toContain('Regional Map');
    expect(html).toContain('Broker page');
  });
});
