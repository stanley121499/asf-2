/**
 * Registers the device Expo push token after the customer is signed in.
 * Also handles lock-screen / tray taps → mark-read + deep link navigation.
 */

import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuthContext } from "@/context/AuthContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { resolveNotificationHref } from "@/lib/notificationNavigation";
import {
  configureForegroundNotificationHandler,
  isExpoGoRuntime,
  registerForPushNotifications,
} from "@/lib/pushNotifications";

configureForegroundNotificationHandler();

/**
 * Mount once under authenticated providers. Soft-fails when permission is denied
 * or the runtime is Expo Go (remote push unavailable on SDK 53+).
 */
export function PushTokenRegistrar(): null {
  const { user } = useAuthContext();
  const { markAsRead } = useNotificationContext();
  const router = useRouter();
  const registeringForUser = useRef<string | null>(null);

  /**
   * After sign-in: request permission and upsert `push_tokens`.
   */
  useEffect(() => {
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
   * Lock-screen / notification-tray tap → mark inbox row read + navigate.
   * Skipped in Expo Go where the notifications response API is unavailable.
   */
  useEffect(() => {
    if (Platform.OS === "web" || isExpoGoRuntime()) {
      return;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const notificationId =
          data !== null &&
          data !== undefined &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          "notification_id" in data &&
          typeof data.notification_id === "string"
            ? data.notification_id
            : null;

        if (notificationId !== null && notificationId.length > 0) {
          void markAsRead(notificationId);
        }

        const href = resolveNotificationHref(data);
        if (href !== null) {
          router.push(href);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [markAsRead, router]);

  return null;
}
