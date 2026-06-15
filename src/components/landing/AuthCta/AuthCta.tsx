// AuthCta.tsx — server component that renders auth-aware landing CTAs.
// Anonymous visitors get Sign in + Create account (server-action forms that redirect to the
// shared IdP). Authenticated visitors get a single "Go to Workspace" link. No secrets reach
// the client; sign-in/up run as server actions (see features/auth/actions.ts).
import { auth } from '@/features/auth/auth';
import { AuthCtaClient } from './AuthCtaClient';
import type { AuthCtaProps } from './AuthCta.types';

export async function AuthCta({ variant }: AuthCtaProps) {
  const session = await auth();

  return <AuthCtaClient variant={variant} authenticated={Boolean(session?.user)} />;
}
