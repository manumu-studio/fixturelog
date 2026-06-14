// Client-safe auth barrel. Importing this never pulls server secrets into the client bundle.
// Server code imports `auth`, `signIn`, `signOut`, `handlers` from '@/features/auth/auth' directly.
export { useSession } from './useSession';
export type { Session } from 'next-auth';
