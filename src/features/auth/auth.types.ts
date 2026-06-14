// Module augmentation for next-auth: adds the OIDC externalId to the session/JWT.
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      externalId: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    externalId?: string;
    idToken?: string;
    email?: string | null;
    name?: string | null;
  }
}
