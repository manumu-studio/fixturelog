// Server env schema + production secret guard for FixtureLog auth.
// Pure module (no `server-only`) so the parsing + guard can be unit-tested directly.
// env.server.ts wraps this with `server-only` to keep secrets out of client bundles.
import { z } from 'zod';

// Local-dev placeholders. Production must replace these with real secret-store values.
export const DEV_PLACEHOLDER = 'local-dev-placeholder';
export const DEV_NEXTAUTH_SECRET = 'local-dev-nextauth-secret-32-chars-minimum';

const serverEnvSchema = z.object({
  // Auth.js / ManuMuStudio OAuth client — server-only secrets.
  NEXTAUTH_SECRET: z.string().min(32).optional().default(DEV_NEXTAUTH_SECRET),
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3000'),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
  AUTH_ISSUER_URL: z.string().url().optional().default('https://auth.manumustudio.com'),
  AUTH_CLIENT_ID: z.string().min(1).optional().default(DEV_PLACEHOLDER),
  AUTH_CLIENT_SECRET: z.string().min(1).optional().default(DEV_PLACEHOLDER),
  // Anthropic Claude key for the broker copilot (server-only). The user supplies the real
  // value in .env.local / Vercel; the placeholder keeps local builds + CI compiling. A real
  // key must carry the `sk-ant-` prefix, so a one-character garbage value fails here (at parse
  // time) rather than later, at the first Anthropic call. The dev placeholder stays valid and
  // is rejected separately by the production guard below.
  ANTHROPIC_API_KEY: z
    .string()
    .refine(
      (value) => value === DEV_PLACEHOLDER || value.startsWith('sk-ant-'),
      { message: 'ANTHROPIC_API_KEY must be a real Anthropic key (sk-ant-…).' },
    )
    .optional()
    .default(DEV_PLACEHOLDER),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Parse env and enforce the production guard: production must not run on dev placeholders.
// CI is exempt so the production build can compile without real secrets.
export function parseServerEnv(raw: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.parse(raw);

  const isCi = raw.CI === 'true';
  const hasPlaceholderAuth =
    parsed.AUTH_CLIENT_ID === DEV_PLACEHOLDER ||
    parsed.AUTH_CLIENT_SECRET === DEV_PLACEHOLDER ||
    parsed.NEXTAUTH_SECRET === DEV_NEXTAUTH_SECRET ||
    parsed.ANTHROPIC_API_KEY === DEV_PLACEHOLDER;

  if (parsed.NODE_ENV === 'production' && hasPlaceholderAuth && !isCi) {
    throw new Error(
      'Missing production secrets: AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, NEXTAUTH_SECRET, and ' +
        'ANTHROPIC_API_KEY must be set to real values (not local-dev placeholders). ' +
        'Set them in the deployment secret store.',
    );
  }

  return parsed;
}
