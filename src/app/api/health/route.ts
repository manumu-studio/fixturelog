// src/app/api/health/route.ts — health check for CI smoke test
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkHealth } from '@/lib/health';

export async function GET() {
  const health = await checkHealth(() => prisma.$queryRaw`SELECT 1`);
  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
