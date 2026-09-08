/**
 * Background Always location for nearby wishlist-stock matching.
 *
 * Registers a TaskManager task that POSTs `/api/location/snapshot` when the
 * OS delivers location updates. Runs only for signed-in customers when the
 * `nearby_stock_push` preference is enabled. Soft-fails on web, Expo Go,
 * simulators, and when Always permission is denied.
 *
 * `TaskManager.defineTask` must stay at module top-level so the JS bundle can
 * execute the task when the app is launched in the background.
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Linking, Platform } from "react-native";

import { apiFetch } from "@/lib/apiFetch";
import { isExpoGoRuntime } from "@/lib/pushNotifications";
import { supabase } from "@/lib/supabase";

/** Stable task name shared by `defineTask` and `startLocationUpdatesAsync`. */
export const NEARBY_LOCATION_TASK_NAME = "asf-nearby-stock-location";

/** Result of requesting / syncing Always background location. */
export type NearbyLocationSyncResult =
  | "started"
  | "stopped"
  | "denied"
  | "unavailable"
  | "skipped";

/** Latest coordinates extracted from a background location task payload. */
type NearbyCoords = {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
};

/**
 * Reads the newest valid coordinates from a TaskManager location payload.
 *
 * @param value - Raw `TaskManager` data payload
 */
function readLatestCoords(value: unknown): NearbyCoords | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const locations = record["locations"];
  if (!Array.isArray(locations) || locations.length === 0) {
    return null;
  }

  const latest = locations[locations.length - 1];
  if (typeof latest !== "object" || latest === null || Array.isArray(latest)) {
    return null;
  }
  const latestRecord = latest as Record<string, unknown>;
  const coords = latestRecord["coords"];
  if (typeof coords !== "object" || coords === null || Array.isArray(coords)) {
    return null;
  }
  const coordsRecord = coords as Record<string, unknown>;
  const latitude = coordsRecord["latitude"];
  const longitude = coordsRecord["longitude"];
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  const accuracyRaw = coordsRecord["accuracy"];
  const accuracyM =
    typeof accuracyRaw === "number" && Number.isFinite(accuracyRaw) ? accuracyRaw : null;

  return { latitude, longitude, accuracyM };
}

/**
 * POSTs the latest coordinates to the Next location snapshot API.
 *
 * @param latitude - WGS84 latitude
 * @param longitude - WGS84 longitude
 * @param accuracyM - Horizontal accuracy in meters when known
 */
async function postLocationSnapshot(
  latitude: number,
  longitude: number,
  accuracyM: number | null,
): Promise<void> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return;
  }

  const body: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
  } = { latitude, longitude };

  if (typeof accuracyM === "number" && Number.isFinite(accuracyM) && accuracyM >= 0) {
    body.accuracyM = accuracyM;
  }

  try {
    const response = await apiFetch("/api/location/snapshot", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!response.ok && response.status !== 401) {
      console.warn("[nearby-location] snapshot HTTP", response.status);
    }
  } catch (err) {
    console.warn(
      "[nearby-location] snapshot network error",
      err instanceof Error ? err.message : err,
    );
  }
}

TaskManager.defineTask(NEARBY_LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error !== null) {
    console.warn("[nearby-location] task error:", error.message);
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session === null || typeof session.user?.id !== "string") {
    return;
  }

  const coords = readLatestCoords(data);
  if (coords === null) {
    return;
  }

  await postLocationSnapshot(coords.latitude, coords.longitude, coords.accuracyM);
});

/**
 * Returns whether this runtime can register background location updates.
 */
function canUseBackgroundLocation(): boolean {
  if (Platform.OS === "web") {
    return false;
  }
  if (isExpoGoRuntime()) {
    return false;
  }
  return true;
}

/**
 * Opens the OS app settings page so the user can grant Always location.
 */
export async function openAppLocationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (err) {
    console.warn(
      "[nearby-location] openSettings failed",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Requests foreground then Always background location permission.
 *
 * @returns `"granted"` when Always is available, otherwise `"denied"` / `"unavailable"`
 */
export async function requestAlwaysLocationPermission(): Promise<
  "granted" | "denied" | "unavailable"
> {
  if (!canUseBackgroundLocation()) {
    return "unavailable";
  }

  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== Location.PermissionStatus.GRANTED) {
      return "denied";
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== Location.PermissionStatus.GRANTED) {
      return "denied";
    }

    return "granted";
  } catch (err) {
    console.warn(
      "[nearby-location] permission request failed",
      err instanceof Error ? err.message : err,
    );
    return "unavailable";
  }
}

/**
 * Reads current Always / background permission without prompting.
 */
export async function getBackgroundLocationPermissionStatus(): Promise<
  Location.PermissionStatus | "unavailable"
> {
  if (!canUseBackgroundLocation()) {
    return "unavailable";
  }

  try {
    const background = await Location.getBackgroundPermissionsAsync();
    return background.status;
  } catch (err) {
    console.warn(
      "[nearby-location] getBackgroundPermissions failed",
      err instanceof Error ? err.message : err,
    );
    return "unavailable";
  }
}

/**
 * Stops the nearby background location task when it is running.
 */
export async function stopNearbyBackgroundLocation(): Promise<void> {
  if (!canUseBackgroundLocation()) {
    return;
  }

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(
      NEARBY_LOCATION_TASK_NAME,
    );
    if (started) {
      await Location.stopLocationUpdatesAsync(NEARBY_LOCATION_TASK_NAME);
    }
  } catch (err) {
    console.warn(
      "[nearby-location] stop failed",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Starts significant-change / balanced background updates when Always is granted.
 *
 * @returns Whether updates were started
 */
export async function startNearbyBackgroundLocation(): Promise<boolean> {
  if (!canUseBackgroundLocation()) {
    return false;
  }

  try {
    const background = await Location.getBackgroundPermissionsAsync();
    if (background.status !== Location.PermissionStatus.GRANTED) {
      return false;
    }

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
      NEARBY_LOCATION_TASK_NAME,
    );
    if (alreadyStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(NEARBY_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 150,
      timeInterval: 5 * 60 * 1000,
      deferredUpdatesInterval: 5 * 60 * 1000,
      deferredUpdatesDistance: 150,
      showsBackgroundLocationIndicator: false,
      pausesUpdatesAutomatically: true,
      activityType: Location.ActivityType.Other,
      foregroundService: {
        notificationTitle: "ASF",
        notificationBody: "Updating nearby store availability",
        notificationColor: "#000000",
      },
    });

    // Seed an immediate snapshot so the matcher has fresh coords without waiting.
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await postLocationSnapshot(
        position.coords.latitude,
        position.coords.longitude,
        typeof position.coords.accuracy === "number"
          ? position.coords.accuracy
          : null,
      );
    } catch (seedErr) {
      console.warn(
        "[nearby-location] initial snapshot soft-failed",
        seedErr instanceof Error ? seedErr.message : seedErr,
      );
    }

    return true;
  } catch (err) {
    console.warn(
      "[nearby-location] start failed",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * Syncs background location with auth + nearby preference state.
 *
 * When `nearbyEnabled` is false or there is no user, stops updates.
 * When enabled, requests Always permission (if needed) and starts the task.
 *
 * @param options.userId - Authenticated customer id, or null when signed out
 * @param options.nearbyEnabled - `notification_preferences.nearby_stock_push`
 * @param options.requestPermission - When true, prompt if Always is not granted
 */
export async function syncNearbyBackgroundLocation(options: {
  userId: string | null;
  nearbyEnabled: boolean;
  requestPermission?: boolean;
}): Promise<NearbyLocationSyncResult> {
  const userId =
    typeof options.userId === "string" && options.userId.trim().length > 0
      ? options.userId.trim()
      : null;

  if (userId === null || options.nearbyEnabled !== true) {
    await stopNearbyBackgroundLocation();
    return "stopped";
  }

  if (!canUseBackgroundLocation()) {
    return "unavailable";
  }

  const status = await getBackgroundLocationPermissionStatus();
  if (status === Location.PermissionStatus.GRANTED) {
    const started = await startNearbyBackgroundLocation();
    return started ? "started" : "denied";
  }

  if (options.requestPermission === true) {
    const permission = await requestAlwaysLocationPermission();
    if (permission !== "granted") {
      return permission === "unavailable" ? "unavailable" : "denied";
    }
    const started = await startNearbyBackgroundLocation();
    return started ? "started" : "denied";
  }

  return "skipped";
}
