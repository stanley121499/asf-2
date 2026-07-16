import type { TranslateFn } from "@/i18n/types";

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
 * Uses i18n keys under `locations.distance.*`.
 */
export function formatDistanceKm(km: number, translate: TranslateFn): string {
  if (km < 0.1) {
    return translate("locations.distance.within100m");
  }
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return translate("locations.distance.meters", { count: meters });
  }
  const kmLabel = km.toFixed(1);
  return translate("locations.distance.kilometers", { count: kmLabel });
}
