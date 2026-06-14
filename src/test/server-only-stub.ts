// Test stub for the `server-only` package. The real module throws when imported
// outside a React Server Component. Vitest aliases `server-only` to this no-op so
// server modules (env.server, auth, require-session, server-fetch) can be unit-tested.
export {};
