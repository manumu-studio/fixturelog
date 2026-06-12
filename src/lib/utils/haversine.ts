// Haversine great-circle distance utility — returns distance in nautical miles

const EARTH_RADIUS_KM = 6371;
const KM_PER_NM = 1.852;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 * Returns distance in nautical miles, rounded to 2 decimal places.
 */
export function haversineNm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round((distanceKm / KM_PER_NM) * 100) / 100;
}
