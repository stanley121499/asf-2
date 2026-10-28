/**
 * Kill-switch for wishlist nearby-stock alerts (Always location + TaskManager).
 *
 * Default **OFF** so release / preview APKs never register background location
 * at cold start. Re-enable by baking
 * `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED=true` into the next EAS build
 * (or flipping the hardcoded fallback below after the crash is confirmed fixed).
 */

/**
 * Parses `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED`.
 * Only the exact string `"true"` (case-insensitive) turns the feature on.
 *
 * @returns Whether nearby stock background alerts may run
 */
function readNearbyStockAlertsEnabled(): boolean {
  const raw = (process.env.EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return raw === "true";
}

/**
 * Master flag for nearby wishlist-stock push / background Always location.
 * Kept `false` unless explicitly enabled via env so APK cold start stays safe.
 */
export const NEARBY_STOCK_ALERTS_ENABLED: boolean = readNearbyStockAlertsEnabled();
