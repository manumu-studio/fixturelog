// GET /api/weather/marine — Open-Meteo proxy; validates lat/lng, delegates to enricher, returns ad-hoc snapshot (no persistence)
import { NextRequest, NextResponse } from 'next/server';
import { WeatherQuerySchema } from '@/lib/validators/weather.validators';
import { fetchMarineWeather } from '@/lib/services/weather-enricher';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Parse and validate query params
  const { searchParams } = request.nextUrl;
  const parseResult = WeatherQuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues },
      { status: 400 },
    );
  }

  const { lat, lng } = parseResult.data;

  // 2. Delegate to enricher (cache + Open-Meteo fetch + verdict)
  try {
    const result = await fetchMarineWeather(lat, lng);

    // 3. Return ad-hoc snapshot: id omitted (not persisted), fixtureId always null
    return NextResponse.json(
      {
        data: {
          fixtureId: null,
          lat: result.lat,
          lng: result.lng,
          waveHeightM: result.waveHeightM,
          swellHeightM: result.swellHeightM,
          windWaveHeightM: result.windWaveHeightM,
          workabilityVerdict: result.workabilityVerdict,
          laycanFrom: null,
          laycanTo: null,
          fetchedAt: result.fetchedAt,
        },
      },
      { status: 200 },
    );
  } catch {
    // 4. Open-Meteo unreachable or upstream shape invalid → 502
    return NextResponse.json(
      { error: 'Weather service unavailable' },
      { status: 502 },
    );
  }
}
