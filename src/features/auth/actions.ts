// Server actions for landing auth CTAs. These run on the server and call Auth.js signIn,
// which redirects the browser to the shared ManuMuStudio IdP. No secrets reach the client.
'use server';

import { signIn } from '@/features/auth/auth';

// Route through the role-aware post-login hop so charterers land on /portal and brokers
// on /requirements (see app/api/auth/post-login).
const POST_LOGIN = '/api/auth/post-login';

export async function signInAction(): Promise<void> {
  await signIn('manumustudio', { redirectTo: POST_LOGIN });
}

export async function signUpAction(): Promise<void> {
  await signIn('manumustudio', { redirectTo: POST_LOGIN }, { mode: 'signup' });
}
