// AuthCtaClient.tsx — client-side auth CTAs with immediate pending spinners (no arrow suffixes).

'use client';

import { signInAction, signUpAction } from '@/features/auth/actions';
import { LANDING_AUTH_CTA } from '@/lib/constants/landing-copy';
import { PendingLink, PendingSubmit } from '@/components/shared/pending';
import type { AuthCtaProps } from './AuthCta.types';
import styles from './AuthCta.module.css';

interface AuthCtaClientProps extends AuthCtaProps {
  readonly authenticated: boolean;
}

export function AuthCtaClient({ variant, authenticated }: AuthCtaClientProps) {
  const groupClass = variant === 'hero' ? styles.hero : styles.nav;

  if (authenticated) {
    return (
      <div className={groupClass}>
        <PendingLink
          href="/api/auth/post-login"
          className={styles.primary}
          loadingLabel="Opening workspace"
        >
          {LANDING_AUTH_CTA.workspace}
        </PendingLink>
      </div>
    );
  }

  return (
    <div className={groupClass}>
      <form action={signInAction}>
        <PendingSubmit className={styles.primary} loadingLabel="Signing in">
          {LANDING_AUTH_CTA.signIn}
        </PendingSubmit>
      </form>
      <form action={signUpAction}>
        <PendingSubmit className={styles.secondary} loadingLabel="Creating account">
          {LANDING_AUTH_CTA.signUp}
        </PendingSubmit>
      </form>
    </div>
  );
}
