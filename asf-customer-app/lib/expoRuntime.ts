/**
 * Runtime environment helpers shared by push and background-location modules.
 *
 * Kept free of native module imports so callers can detect Expo Go without
 * triggering SDK 53+ import-time fatals from `expo-notifications`.
 */

import Constants from "expo-constants";

/**
 * True when running inside Expo Go, where remote push (SDK 53+) and some
 * background native APIs are unavailable.
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
