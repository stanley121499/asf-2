/**
 * Keeps Always background location in sync with auth + nearby stock preference.
 * Mount once under authenticated providers (alongside {@link PushTokenRegistrar}).
 */

import React, { useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { useAuthContext } from "@/context/AuthContext";
import {
  syncNearbyBackgroundLocation,
} from "@/lib/backgroundLocation";
import { isExpoGoRuntime } from "@/lib/pushNotifications";
import { supabase } from "@/lib/supabase";

/**
 * Loads `nearby_stock_push` for the signed-in user (defaults to true when missing).
 *
 * @param userId - Authenticated customer UUID
 */
async function loadNearbyStockPref(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("nearby_stock_push")
    .eq("user_id", userId)
    .maybeSingle();

  if (error !== null) {
    console.warn("[nearby-location] pref load failed:", error.message);
    return true;
  }

  if (data === null) {
    return true;
  }

  return data.nearby_stock_push !== false;
}

/**
 * Starts or stops the nearby location task when the customer signs in/out
 * and when the app returns to the foreground (pref may have changed).
 */
export function BackgroundLocationRegistrar(): null {
  const { user } = useAuthContext();
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || isExpoGoRuntime()) {
      return;
    }

    const userId =
      typeof user?.id === "string" && user.id.length > 0 ? user.id : null;

    let cancelled = false;

    async function sync(requestPermission: boolean): Promise<void> {
      if (userId === null) {
        lastSyncedKey.current = null;
        await syncNearbyBackgroundLocation({
          userId: null,
          nearbyEnabled: false,
          requestPermission: false,
        });
        return;
      }

      const nearbyEnabled = await loadNearbyStockPref(userId);
      if (cancelled) {
        return;
      }

      const syncKey = `${userId}:${nearbyEnabled ? "1" : "0"}`;
      if (!requestPermission && lastSyncedKey.current === syncKey) {
        return;
      }

      const result = await syncNearbyBackgroundLocation({
        userId,
        nearbyEnabled,
        requestPermission,
      });

      if (cancelled) {
        return;
      }

      if (result === "started" || result === "stopped") {
        lastSyncedKey.current = syncKey;
      }
    }

    void sync(false);

    const onAppState = (next: AppStateStatus): void => {
      if (next === "active") {
        void sync(false);
      }
    };

    const subscription = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [user?.id]);

  return null;
}
