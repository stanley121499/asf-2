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
import { isExpoGoRuntime } from "@/lib/expoRuntime";
import { NEARBY_STOCK_ALERTS_ENABLED } from "@/lib/nearbyStockAlerts";
import { supabase } from "@/lib/supabase";

/**
 * Loads `nearby_stock_push` for the signed-in user.
 * Defaults to **false** when the row is missing or the query fails so cold start
 * never begins Always location until the customer opts in (settings / existing row).
 *
 * @param userId - Authenticated customer UUID
 */
async function loadNearbyStockPref(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("nearby_stock_push")
      .eq("user_id", userId)
      .maybeSingle();

    if (error !== null) {
      console.warn("[nearby-location] pref load failed:", error.message);
      return false;
    }

    if (data === null) {
      return false;
    }

    return data.nearby_stock_push === true;
  } catch (err) {
    console.warn(
      "[nearby-location] pref load soft-failed",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * Starts or stops the nearby location task when the customer signs in/out
 * and when the app returns to the foreground (pref may have changed).
 */
export function BackgroundLocationRegistrar(): null {
  const { user } = useAuthContext();
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!NEARBY_STOCK_ALERTS_ENABLED) {
      return;
    }

    if (Platform.OS === "web" || isExpoGoRuntime()) {
      return;
    }

    const userId =
      typeof user?.id === "string" && user.id.length > 0 ? user.id : null;

    let cancelled = false;

    async function sync(requestPermission: boolean): Promise<void> {
      try {
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

        // Auto-sync never prompts; only starts when Always is already granted.
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
      } catch (err) {
        console.warn(
          "[nearby-location] registrar sync soft-failed",
          err instanceof Error ? err.message : err,
        );
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
