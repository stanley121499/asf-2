/**
 * Geographic distance helpers for server-side nearby matching.
 * Ported from `asf-customer-app/lib/storeLocationDistance.ts` (Haversine only).
 */

/** Mean Earth radius used by the Expo store-locator Haversine. */
const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 *
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two WGS-84 coordinates, in kilometres.
 *
 * @param lat1 - Origin latitude
 * @param lon1 - Origin longitude
 * @param lat2 - Destination latitude
 * @param lon2 - Destination longitude
 * @returns Distance in kilometres
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
