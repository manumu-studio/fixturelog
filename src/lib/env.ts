// Client-safe public environment. Safe to import from client OR server components.
// Only NEXT_PUBLIC_* values belong here — never secrets (see env.server.ts for those).
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

// Reference the var explicitly (not all of process.env) so Next can inline it client-side.
export const env = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export type Env = z.infer<typeof clientEnvSchema>;
