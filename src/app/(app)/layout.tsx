// (app)/layout.tsx — authenticated route group shell. Every operational page gets
// the shared navbar; the nav model switches between broker and client by session role.
import type { ReactNode } from 'react';
import { requireSession } from '@/lib/auth/require-session';
import { resolveHomeRoute } from '@/lib/auth/resolve-home-route';
import { PortalShell } from '@/components/portal/PortalShell';
import { BROKER_NAV_ITEMS, PORTAL_NAV_ITEMS } from '@/components/portal/PortalNav';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();
  const homeRoute = await resolveHomeRoute(user);

  if (homeRoute === '/dashboard') {
    return (
      <PortalShell
        user={{ name: user.name, email: user.email }}
        navItems={BROKER_NAV_ITEMS}
        homeHref="/dashboard"
        brandSub="Broker Workspace"
      >
        {children}
      </PortalShell>
    );
  }

  return (
    <PortalShell
      user={{ name: user.name, email: user.email }}
      navItems={PORTAL_NAV_ITEMS}
      homeHref="/portal"
      brandSub="Client Portal"
    >
      {children}
    </PortalShell>
  );
}
