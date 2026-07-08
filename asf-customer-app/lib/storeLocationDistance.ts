import { DEFAULT_LOCALE, type Locale } from "@/i18n/types";

/**
 * Haversine distance between two WGS-84 coordinates, in kilometres.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

/**
 * Formats a distance for display (m when under 1 km, otherwise km with one decimal).
 * Uses bilingual labels aligned with `locations.within100m|meters|kilometers`.
 */
export function formatDistanceKm(km: number, locale: Locale = DEFAULT_LOCALE): string {
  if (km < 0.1) {
    return locale === "en" ? "Within 100 m" : "100 m 内";
  }
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return locale === "en" ? `${meters} m` : `${meters} m`;
  }
  const kmLabel = km.toFixed(1);
  return locale === "en" ? `${kmLabel} km` : `${kmLabel} km`;
}
