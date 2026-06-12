// POST /api/fixtures/:id/weather — fetch marine weather via enricher, persist WeatherSnapshot linked to fixture
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CuidParamSchema } from '@/lib/validators/common.validators';
import { FixtureWeatherRequestSchema } from '@/lib/validators/weather.validators';
import { fetchMarineWeather } from '@/lib/services/weather-enricher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // 1. Validate route param
  const { id } = await params;
  const paramParsed = CuidParamSchema.safeParse({ id });
  if (!paramParsed.success) {
    return NextResponse.json(
      { error: paramParsed.error.issues },
      { status: 400 },
    );
  }

  // 2. Defensive JSON parse, then validate body (before any DB or enricher call)
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = FixtureWeatherRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { lat, lng, laycanFrom: bodyLaycanFrom, laycanTo: bodyLaycanTo } = parsed.data;

  // 3. Look up fixture
  const fixture = await prisma.fixture.findUnique({ where: { id } });
  if (fixture === null) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }

  // 4. Enrich weather via Open-Meteo
  let enrichment: Awaited<ReturnType<typeof fetchMarineWeather>>;
  try {
    enrichment = await fetchMarineWeather(lat, lng);
  } catch {
    return NextResponse.json(
      { error: 'Weather service unavailable' },
      { status: 502 },
    );
  }

  // 5. Derive laycan dates from body, falling back to fixture fields
  const laycanFrom: Date | null =
    bodyLaycanFrom ?? fixture.commencement ?? null;

  let laycanTo: Date | null = null;
  if (bodyLaycanTo !== undefined) {
    laycanTo = bodyLaycanTo;
  } else if (fixture.commencement !== null && fixture.durationDays !== null) {
    const to = new Date(fixture.commencement);
    to.setDate(to.getDate() + fixture.durationDays);
    laycanTo = to;
  }

  // 6. Persist snapshot
  const snapshot = await prisma.weatherSnapshot.create({
    data: {
      fixtureId: id,
      lat,
      lng,
      waveHeightM: enrichment.waveHeightM,
      swellHeightM: enrichment.swellHeightM,
      windWaveHeightM: enrichment.windWaveHeightM,
      workabilityVerdict: enrichment.workabilityVerdict,
      laycanFrom,
      laycanTo,
      fetchedAt: enrichment.fetchedAt,
    },
  });

  // 7. Return 201 with fixtureId set to actual fixture ID (never null)
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
