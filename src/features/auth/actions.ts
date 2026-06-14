// Server actions for landing auth CTAs. These run on the server and call Auth.js signIn,
// which redirects the browser to the shared ManuMuStudio IdP. No secrets reach the client.
'use server';

import { signIn } from '@/features/auth/auth';

export async function signInAction(): Promise<void> {
  await signIn('manumustudio', { redirectTo: '/requirements' });
}

export async function signUpAction(): Promise<void> {
  await signIn('manumustudio', { redirectTo: '/requirements' }, { mode: 'signup' });
}
