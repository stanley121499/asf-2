/**
 * Registers the device Expo push token after the customer is signed in.
 * Also handles lock-screen / tray taps → mark-read + deep link navigation.
 *
 * Notification handler + listeners are deferred until mount (not module import)
 * so a missing native module cannot kill cold start before RootErrorBoundary.
 */

import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuthContext } from "@/context/AuthContext";
import { useDesignPreview } from "@/context/DesignPreviewContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { useStoreWelcome } from "@/context/StoreWelcomeContext";
import { resolveNotificationHref } from "@/lib/notificationNavigation";
import { isExpoGoRuntime } from "@/lib/expoRuntime";
import {
  configureForegroundNotificationHandler,
  registerForPushNotifications,
} from "@/lib/pushNotifications";
import { PUSH_NOTIFICATIONS_ENABLED } from "@/lib/pushNotificationsEnabled";
import {
  extractStoreWelcomePayload,
  isNearbyWishlistStockNotification,
} from "@/lib/storeWelcome";

/**
 * Lazily loads expo-notifications response APIs. Skips Expo Go (SDK 53+
 * fatals on Android import) and soft-fails when the native module is missing.
 */
function loadNotificationsResponseApi(): {
  addNotificationResponseReceivedListener: (
    listener: (response: {
      notification: {
        request: {
          content: {
            data: unknown;
          };
        };
      };
    }) => void,
  ) => { remove: () => void };
} | null {
  if (isExpoGoRuntime()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional soft-fail require
    const mod = require("expo-notifications") as {
      addNotificationResponseReceivedListener?: (
        listener: (response: {
          notification: {
            request: {
              content: {
                data: unknown;
              };
            };
          };
        }) => void,
      ) => { remove: () => void };
    };
    if (typeof mod.addNotificationResponseReceivedListener !== "function") {
      return null;
    }
    return {
      addNotificationResponseReceivedListener:
        mod.addNotificationResponseReceivedListener,
    };
  } catch (err) {
    console.warn(
      "[push] expo-notifications unavailable",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Mount once under authenticated providers. Soft-fails when permission is denied
 * or the runtime is Expo Go (remote push unavailable on SDK 53+).
 */
export function PushTokenRegistrar(): null {
  const { user } = useAuthContext();
  const { markAsRead } = useNotificationContext();
  const { welcomeVariant } = useDesignPreview();
  const { presentWelcome } = useStoreWelcome();
  const router = useRouter();
  const registeringForUser = useRef<string | null>(null);
  const welcomeVariantRef = useRef(welcomeVariant);
  const presentWelcomeRef = useRef(presentWelcome);

  useEffect(() => {
    welcomeVariantRef.current = welcomeVariant;
  }, [welcomeVariant]);

  useEffect(() => {
    presentWelcomeRef.current = presentWelcome;
  }, [presentWelcome]);

  /**
   * Configure foreground presentation once after mount (never at import time).
   */
  useEffect(() => {
    if (!PUSH_NOTIFICATIONS_ENABLED) {
      return;
    }
    try {
      configureForegroundNotificationHandler();
    } catch (err) {
      console.warn(
        "[push] configureForegroundNotificationHandler soft-failed",
        err instanceof Error ? err.message : err,
      );
    }
  }, []);

  /**
   * After sign-in: request permission and upsert `push_tokens`.
   */
  useEffect(() => {
    if (!PUSH_NOTIFICATIONS_ENABLED) {
      return;
    }
    if (Platform.OS === "web" || isExpoGoRuntime()) {
      return;
    }

    const userId = user?.id;
    if (typeof userId !== "string" || userId.length === 0) {
      registeringForUser.current = null;
      return;
    }

    if (registeringForUser.current === userId) {
      return;
    }
    registeringForUser.current = userId;

    void registerForPushNotifications(userId);
  }, [user?.id]);

  /**
   * Lock-screen / notification-tray tap → mark inbox row read + navigate
   * (or present store-welcome when nearby + Design Lab variant ≠ off).
   * Skipped in Expo Go where the notifications response API is unavailable.
   */
  useEffect(() => {
    if (!PUSH_NOTIFICATIONS_ENABLED) {
      return;
    }
    if (Platform.OS === "web" || isExpoGoRuntime()) {
      return;
    }

    const Notifications = loadNotificationsResponseApi();
    if (Notifications === null) {
      return;
    }

    let subscription: { remove: () => void } | null = null;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          try {
            const data = response.notification.request.content.data;
            const dataRecord =
              data !== null &&
              data !== undefined &&
              typeof data === "object" &&
              !Array.isArray(data)
                ? (data as Record<string, unknown>)
                : null;

            const notificationId =
              dataRecord !== null &&
              "notification_id" in dataRecord &&
              typeof dataRecord.notification_id === "string"
                ? dataRecord.notification_id
                : null;

            if (notificationId !== null && notificationId.length > 0) {
              void markAsRead(notificationId);
            }

            if (dataRecord !== null) {
              const typeRaw = dataRecord["type"];
              const type =
                typeof typeRaw === "string" ? typeRaw : null;
              const isNearby = isNearbyWishlistStockNotification(
                type,
                dataRecord,
              );
              const activeWelcome = welcomeVariantRef.current;
              if (isNearby && activeWelcome !== "off") {
                const welcomePayload = extractStoreWelcomePayload(
                  type,
                  dataRecord,
                );
                if (welcomePayload !== null) {
                  presentWelcomeRef.current(welcomePayload, activeWelcome);
                  return;
                }
              }

              const href = resolveNotificationHref(dataRecord);
              if (href !== null) {
                router.push(href);
              }
            }
          } catch (handlerErr) {
            console.warn(
              "[push] notification response handler soft-failed",
              handlerErr instanceof Error ? handlerErr.message : handlerErr,
            );
          }
        },
      );
    } catch (err) {
      console.warn(
        "[push] addNotificationResponseReceivedListener soft-failed",
        err instanceof Error ? err.message : err,
      );
      return;
    }

    return () => {
      if (subscription !== null) {
        subscription.remove();
      }
    };
  }, [markAsRead, router]);

  return null;
}
