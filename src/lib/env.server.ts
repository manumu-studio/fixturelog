// Server-only auth env. Importing this from a client bundle is a build error (via
// `server-only`), which keeps AUTH_CLIENT_SECRET and NEXTAUTH_SECRET off the client.
import 'server-only';
import { parseServerEnv } from './env.server.schema';

export const serverEnv = parseServerEnv(process.env);
export type { ServerEnv } from './env.server.schema';
