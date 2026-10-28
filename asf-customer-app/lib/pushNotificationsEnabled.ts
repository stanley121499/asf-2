/**
 * Kill-switch for Expo push registration (`PushTokenRegistrar` +
 * `expo-notifications` native calls).
 *
 * Default **OFF** so preview / release APKs never touch notifications at
 * cold start while we bisect the Android instant-crash. Re-enable by baking
 * `EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true` into the next EAS build.
 *
 * Nearby stock alerts have a separate flag (`NEARBY_STOCK_ALERTS_ENABLED` in
 * `@/lib/nearbyStockAlerts`); nearby-off alone did not stop the crash — push
 * still loads after first frame.
 */

/**
 * Parses `EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED`.
 * Only the exact string `"true"` (case-insensitive) turns the feature on.
 *
 * @returns Whether push token registration / notification listeners may run
 */
function readPushNotificationsEnabled(): boolean {
  const raw = (process.env.EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return raw === "true";
}

/**
 * Master flag for customer Expo push (permission, token upsert, tray taps).
 * Kept `false` unless explicitly enabled via env so APK cold start stays lean.
 */
export const PUSH_NOTIFICATIONS_ENABLED: boolean =
  readPushNotificationsEnabled();
