// portal/layout.tsx — charterer-only route group. requireCharterer() redirects brokers to
// their workspace and anonymous visitors to the landing before any portal page renders.
import type { ReactNode } from 'react';
import { requireCharterer } from '@/lib/auth/require-charterer';
import { PortalShell } from '@/components/portal/PortalShell';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const ctx = await requireCharterer();
  return <PortalShell user={{ name: ctx.name, email: ctx.email }}>{children}</PortalShell>;
}
