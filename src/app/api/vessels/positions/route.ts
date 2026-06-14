// GET /api/vessels/positions — latest position per vessel, flattened for map markers

import { NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';
import {
  VesselPositionsResponseSchema,
  type VesselPositionItem,
} from '@/lib/validators/vessel-position.validators';

export async function GET() {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const vessels = await prisma.vessel.findMany({
    where: { positions: { some: {} } }, // only vessels that have at least one position
    select: {
      id: true,
      name: true,
      vesselType: true,
      status: true,
      owner: { select: { name: true } },
      positions: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
        select: { lat: true, lng: true, portName: true, source: true, confidence: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const data: VesselPositionItem[] = [];
  for (const v of vessels) {
    const pos = v.positions[0];
    if (!pos) continue; // where-clause guarantees ≥1, but index access is T | undefined under strict
    data.push({
      id: v.id,
      name: v.name,
      vesselType: v.vesselType,
      status: v.status,
      ownerName: v.owner.name,
      lat: pos.lat,
      lng: pos.lng,
      portName: pos.portName,
      source: pos.source,
      confidence: pos.confidence,
    });
  }

  const body = VesselPositionsResponseSchema.parse({ data }); // validate DB output before returning
  return NextResponse.json(body);
}
