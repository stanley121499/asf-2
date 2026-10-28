/**
 * Expo Push Notification Service helpers for the customer app.
 *
 * Requests permission after sign-in, obtains an Expo push token, and upserts
 * `public.push_tokens` (`app: "customer"`). Soft-fails when permission is denied,
 * the device is a simulator, Expo Go (SDK 53+ has no remote push), or token
 * registration fails.
 *
 * `expo-notifications` is never imported at module top-level — Expo Go Android
 * (SDK 53+) throws a fatal on import. Call sites lazy-require inside try/catch
 * after an Expo Go check. EAS preview / development builds still get real push
 * when the native module loads successfully.
 *
 * No Firebase — tokens are attributed via EAS `projectId` only.
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { isExpoGoRuntime } from "@/lib/expoRuntime";
import { supabase } from "@/lib/supabase";

export { isExpoGoRuntime } from "@/lib/expoRuntime";

/** Supported OS platforms stored on `push_tokens.platform`. */
type PushPlatform = "ios" | "android";

/** Permission status string returned by expo-notifications. */
type NotificationPermissionStatus = "granted" | "denied" | "undetermined" | string;

/**
 * Minimal typed surface of `expo-notifications` used by this module.
 * Avoids a top-level import that fatals in Expo Go on Android (SDK 53+).
 */
type ExpoNotificationsModule = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
    }>;
  }) => void;
  setNotificationChannelAsync: (
    channelId: string,
    channel: { name: string; importance: number },
  ) => Promise<unknown>;
  getPermissionsAsync: () => Promise<{ status: NotificationPermissionStatus }>;
  requestPermissionsAsync: () => Promise<{ status: NotificationPermissionStatus }>;
  getExpoPushTokenAsync: (options: {
    projectId: string;
  }) => Promise<{ data: string }>;
  AndroidImportance: { DEFAULT: number };
};

/** Cached module after a successful lazy load (null = unavailable). */
let cachedNotifications: ExpoNotificationsModule | null | undefined;

/** Dev-only messages already printed once this session (avoid spam). */
const warnedOnceKeys = new Set<string>();

/**
 * Logs a development warning at most once per key.
 *
 * @param key - Stable dedupe key
 * @param message - Warning text
 */
function warnOnce(key: string, message: string): void {
  if (warnedOnceKeys.has(key)) {
    return;
  }
  warnedOnceKeys.add(key);
  if (__DEV__) {
    console.warn(message);
  }
}

/**
 * Lazily loads `expo-notifications`. Must not run in Expo Go on Android —
 * the package throws a fatal on module evaluation (SDK 53+).
 *
 * @returns The notifications module, or null when unavailable / unsafe
 */
function loadNotificationsModule(): ExpoNotificationsModule | null {
  if (isExpoGoRuntime()) {
    warnOnce(
      "expo-go-notifications",
      "[push] Expo Go does not support remote push (SDK 53+). Use a development build to register tokens.",
    );
    return null;
  }

  if (cachedNotifications !== undefined) {
    return cachedNotifications;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional soft-fail require
    const mod = require("expo-notifications") as ExpoNotificationsModule;
    if (
      typeof mod.setNotificationHandler !== "function" ||
      typeof mod.getExpoPushTokenAsync !== "function"
    ) {
      cachedNotifications = null;
      return null;
    }
    cachedNotifications = mod;
    return mod;
  } catch (err) {
    cachedNotifications = null;
    console.warn(
      "[push] expo-notifications unavailable",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Classifies soft/expected push failures (Expo Go, network, unsupported APIs).
 *
 * @param message - Error or warning text
 * @returns Whether the failure should be a one-shot warn instead of ERROR
 */
function isExpectedPushFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("network request failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("expo go") ||
    lower.includes("development build") ||
    lower.includes("not available") ||
    lower.includes("not supported") ||
    lower.includes("removed from expo go") ||
    lower.includes("push notifications")
  );
}

/**
 * Configures how notifications behave while the app is foregrounded.
 * No-op on web and Expo Go (remote push / full notifications API unavailable).
 * Never calls into expo-notifications at module scope.
 */
export function configureForegroundNotificationHandler(): void {
  if (Platform.OS === "web") {
    return;
  }

  const Notifications = loadNotificationsModule();
  if (Notifications === null) {
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn(
      "[push] setNotificationHandler soft-failed",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Resolves the EAS project id used to attribute Expo push tokens.
 *
 * @returns Project UUID string, or null when missing
 */
function resolveEasProjectId(): string | null {
  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExpoConfig === "string" && fromExpoConfig.trim().length > 0) {
    return fromExpoConfig.trim();
  }

  const fromEasConfig = Constants.easConfig?.projectId;
  if (typeof fromEasConfig === "string" && fromEasConfig.trim().length > 0) {
    return fromEasConfig.trim();
  }

  return null;
}

/**
 * Maps React Native `Platform.OS` to the DB check constraint values.
 *
 * @returns `"ios"` | `"android"`, or null on unsupported platforms (e.g. web)
 */
function resolvePushPlatform(): PushPlatform | null {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "android") {
    return "android";
  }
  return null;
}

/**
 * Ensures the Android default notification channel exists (no-op on iOS).
 *
 * @param Notifications - Loaded expo-notifications module
 */
async function ensureAndroidDefaultChannel(
  Notifications: ExpoNotificationsModule,
): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  const importance =
    typeof Notifications.AndroidImportance?.DEFAULT === "number"
      ? Notifications.AndroidImportance.DEFAULT
      : 3;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance,
  });
}

/**
 * Requests notification permission (if needed), obtains an Expo push token,
 * and upserts it into `push_tokens` for the signed-in customer.
 *
 * Soft-fails (returns null) when:
 * - Expo Go / web / not a physical device
 * - permission denied
 * - native module missing
 * - project id / platform / token unavailable
 * - Supabase upsert or network errors
 *
 * @param userId - Authenticated user UUID (`auth.users.id`)
 * @returns Expo push token string on success, otherwise null
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return null;
  }

  if (Platform.OS === "web") {
    return null;
  }

  if (isExpoGoRuntime()) {
    warnOnce(
      "expo-go-register",
      "[push] Skipping token registration in Expo Go — use a development build for push.",
    );
    return null;
  }

  if (!Device.isDevice) {
    warnOnce(
      "not-device",
      "[push] Skipping token registration — not a physical device",
    );
    return null;
  }

  const platform = resolvePushPlatform();
  if (platform === null) {
    return null;
  }

  const Notifications = loadNotificationsModule();
  if (Notifications === null) {
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      warnOnce(
        "permission-denied",
        "[push] Permission not granted — skipping token upsert",
      );
      return null;
    }

    await ensureAndroidDefaultChannel(Notifications);

    const projectId = resolveEasProjectId();
    if (projectId === null) {
      console.error("[push] Missing EAS projectId — cannot get Expo push token");
      return null;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult.data;
    if (typeof token !== "string" || token.trim().length === 0) {
      console.error("[push] Empty Expo push token returned");
      return null;
    }

    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform,
        app: "customer",
        updated_at: updatedAt,
      },
      { onConflict: "user_id,platform,app" },
    );

    if (error !== null) {
      const upsertMessage = error.message;
      if (isExpectedPushFailure(upsertMessage)) {
        warnOnce(
          `upsert:${upsertMessage}`,
          `[push] push_tokens upsert soft-failed: ${upsertMessage}`,
        );
      } else {
        console.error("[push] push_tokens upsert failed:", upsertMessage);
      }
      return null;
    }

    return token;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (isExpectedPushFailure(message)) {
      warnOnce(
        `register:${message}`,
        `[push] registerForPushNotifications soft-failed: ${message}`,
      );
    } else {
      console.error("[push] registerForPushNotifications failed:", message);
    }
    return null;
  }
}
