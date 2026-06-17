// POST /api/broker/voice/token - mints a short-TTL LiveKit access token so a signed-in broker can
// join their voice room. Broker-only via requireBrokerApi (charterer -> 403, anonymous -> 401),
// and the broker id is taken from the provisioned session (guard.ctx.brokerId), NEVER from the
// request body, so a caller can never join as another desk. The token carries the broker id in
// both `identity` and `attributes.broker_id`; the worker reads it back off the joined participant.
// canUpdateOwnMetadata is deliberately NOT granted. LiveKit credentials are read from env and
// validated with Zod: when they are absent (e.g. a build with no secrets) the handler returns a
// clean 503 rather than crashing. Keys live server-side only and never reach the client bundle.
import { AccessToken } from 'livekit-server-sdk';
import { z } from 'zod';
import { requireBrokerApi } from '@/lib/auth/require-broker';

// Short window: the client mints a fresh token each time it connects, so 10 minutes is ample for
// the join handshake while keeping a leaked token's blast radius small.
const TOKEN_TTL = '10m';

// Request body. The only client-supplied value is an optional room name; the broker id is server
// derived and intentionally absent here. Any extra fields (including a spoofed broker_id) are
// ignored, which is asserted by the route test.
const RequestBodySchema = z.object({
  roomName: z.string().trim().min(1).max(120).optional(),
});

// LiveKit credentials live in env on the server only. Validated lazily inside the handler so the
// module imports cleanly at build time even when secrets are absent (the handler then returns 503).
const LiveKitEnvSchema = z.object({
  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
});

// Stable per-broker room name so the same broker always lands in the same room across reconnects.
function defaultRoomName(brokerId: string): string {
  return `fixturelog-voice-${brokerId}`;
}

export async function POST(request: Request): Promise<Response> {
  // 1. Broker-only gate. brokerId comes from the provisioned session, never the body.
  const guard = await requireBrokerApi();
  if (!guard.ok) return guard.response;

  // 2. Validate LiveKit credentials. Absent at build time is fine - fail cleanly with 503.
  const env = LiveKitEnvSchema.safeParse(process.env);
  if (!env.success) {
    return Response.json(
      { error: 'Voice transport is not configured.' },
      { status: 503 },
    );
  }

  // 3. Validate the request body at the fetch boundary. Only an optional room name is accepted.
  let body: unknown = {};
  try {
    const text = await request.text();
    body = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // 4. Mint the token. identity + attributes both carry the SESSION broker id (never the body).
  const brokerId = guard.ctx.brokerId;
  const roomName = parsed.data.roomName ?? defaultRoomName(brokerId);
  const accessToken = new AccessToken(env.data.LIVEKIT_API_KEY, env.data.LIVEKIT_API_SECRET, {
    identity: brokerId,
    ttl: TOKEN_TTL,
    attributes: { broker_id: brokerId },
  });
  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await accessToken.toJwt();
  return Response.json({ serverUrl: env.data.LIVEKIT_URL, token });
}
