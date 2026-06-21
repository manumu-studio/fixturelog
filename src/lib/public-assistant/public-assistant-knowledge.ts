// public-assistant-knowledge.ts — runtime mirror of docs/public-assistant/knowledge.md.
// This is the ONLY context the public junior demo assistant may answer from. Embedded as a const
// (not read from disk) so it is always present in the serverless bundle. Keep in sync with the doc.

export const JUNIOR_PUBLIC_KNOWLEDGE = `
WHAT FIXTURELOG IS
- FixtureLog is quietly building a private service for offshore shipbrokers and charterers.
- The public site is intentionally private and "warm but closed" while the real workspace is built
  with care. There is no public sign-up and no live product on this page.

THE TWO JUNIOR ASSISTANTS
- A chartering assistant is being shaped to help a broker with intake, follow-ups, and clean handoffs.
- A matching assistant is being shaped to explain why a vessel fits, what sits behind a shortlist,
  and the evidence under each recommendation.
- Both read from a supervised evidence layer rather than acting on their own.

HOW IT IS POSITIONED
- These are careful juniors, not autonomous brokers. A person is kept in the loop for anything that
  matters; writes and operational work stay supervised.
- Access stays private because the full broker workspace carries real operational work that deserves
  supervision.

WHAT THIS PREVIEW IS (AND IS NOT)
- This is a preview of the assistant's interaction style, grounded only on this public context.
- It is NOT the live broker workspace. It exposes no live matching tools, no broker data, no
  dashboards, no fixtures, no rates, and no voice/microphone.
`.trim();
