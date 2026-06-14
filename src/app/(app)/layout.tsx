// (app)/layout.tsx — authenticated route group shell.
// requireSession() redirects anonymous visitors to the public landing before any
// operational page renders. Domain API routes are independently gated, so this is
// the page-level half of defense in depth (matches the LSA layout-gating pattern).
import type { ReactNode } from 'react';
import { requireSession } from '@/lib/auth/require-session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
