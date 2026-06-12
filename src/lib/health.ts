// src/lib/health.ts — health check logic, extracted for testability
export type HealthStatus = { status: 'ok' } | { status: 'degraded'; reason: string };

export async function checkHealth(
  queryFn: () => Promise<unknown>,
): Promise<HealthStatus> {
  try {
    await queryFn();
    return { status: 'ok' };
  } catch {
    return { status: 'degraded', reason: 'database unreachable' };
  }
}
