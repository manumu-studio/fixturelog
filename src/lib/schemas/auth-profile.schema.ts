// Zod schema for OIDC / userinfo profile payloads from the ManuMuStudio auth server.
// Every profile/userinfo payload is external data and must cross this boundary.
import { z } from 'zod';

export const OidcProfileSchema = z
  .object({
    sub: z.string(),
    name: z.string().nullish(),
    email: z.string().nullish(),
    picture: z.string().nullish(),
  })
  .passthrough();

export type OidcProfile = z.infer<typeof OidcProfileSchema>;
