// (app)/dashboard/layout.tsx — broker-only guard. The shared (app) layout owns the
// navbar, so this child layout only enforces broker access.
import type { ReactNode } from 'react';
import { requireBroker } from '@/lib/auth/require-broker';

export default async function BrokerDashboardLayout({ children }: { children: ReactNode }) {
  await requireBroker();
  return <>{children}</>;
}
