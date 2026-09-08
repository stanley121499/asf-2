/**
 * Expo Push Notification Service helpers for the customer app.
 *
 * Requests permission after sign-in, obtains an Expo push token, and upserts
 * `public.push_tokens` (`app: "customer"`). Soft-fails when permission is denied,
 * the device is a simulator, Expo Go (SDK 53+ has no remote push), or token
 * registration fails.
 *
 * No Firebase — tokens are attributed via EAS `projectId` only.
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

/** Supported OS platforms stored on `push_tokens.platform`. */
type PushPlatform = "ios" | "android";

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
 * True when running inside Expo Go, where remote push (SDK 53+) is unavailable.
 *
 * @returns Whether the current runtime is Expo Go
 */
export function isExpoGoRuntime(): boolean {
  if (Constants.appOwnership === "expo") {
    return true;
  }
  // StoreClient is Expo Go; Bare / Standalone are development or production builds.
  if (Constants.executionEnvironment === "storeClient") {
    return true;
  }
  return false;
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
 */
export function configureForegroundNotificationHandler(): void {
  if (Platform.OS === "web") {
    return;
  }

  if (isExpoGoRuntime()) {
    warnOnce(
      "expo-go-notifications",
      "[push] Expo Go does not support remote push (SDK 53+). Use a development build to register tokens.",
    );
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
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
 */
async function ensureAndroidDefaultChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Requests notification permission (if needed), obtains an Expo push token,
 * and upserts it into `push_tokens` for the signed-in customer.
 *
 * Soft-fails (returns null) when:
 * - Expo Go / web / not a physical device
 * - permission denied
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

    await ensureAndroidDefaultChannel();

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
