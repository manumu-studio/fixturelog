// AuthCta.tsx — server component that renders auth-aware landing CTAs.
// Anonymous visitors get Sign in + Create account (server-action forms that redirect to the
// shared IdP). Authenticated visitors get a single "Go to Workspace" link. No secrets reach
// the client; sign-in/up run as server actions (see features/auth/actions.ts).
import Link from 'next/link';
import { auth } from '@/features/auth/auth';
import { signInAction, signUpAction } from '@/features/auth/actions';
import { LANDING_AUTH_CTA } from '@/lib/constants/landing-copy';
import type { AuthCtaProps } from './AuthCta.types';
import styles from './AuthCta.module.css';

export async function AuthCta({ variant }: AuthCtaProps) {
  const session = await auth();
  const groupClass = variant === 'hero' ? styles.hero : styles.nav;

  if (session?.user) {
    return (
      <div className={groupClass}>
        <Link href="/requirements" className={styles.primary}>
          {LANDING_AUTH_CTA.workspace}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={groupClass}>
      <form action={signInAction}>
        <button type="submit" className={styles.primary}>
          {LANDING_AUTH_CTA.signIn}
        </button>
      </form>
      <form action={signUpAction}>
        <button type="submit" className={styles.secondary}>
          {LANDING_AUTH_CTA.signUp}
        </button>
      </form>
    </div>
  );
}
