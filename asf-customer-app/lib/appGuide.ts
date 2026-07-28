import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage key marking whether this device has completed (or skipped)
 * the first-launch App Guide tour. Pure module — no React — so it can be
 * called from anywhere (e.g. `app/(tabs)/index.tsx`'s post-ceremony trigger
 * in a later agent) without pulling in the guide engine's context tree.
 */
export const FIRST_GUIDE_STORAGE_KEY = "guide_first_v1_done";

/**
 * Returns whether the current device has already seen (or skipped) the
 * first-launch App Guide. Read failures are treated as "not seen" so a
 * storage error never permanently hides the guide from a beginner user.
 */
export async function hasSeenFirstGuide(): Promise<boolean> {
  try {
    const done = await AsyncStorage.getItem(FIRST_GUIDE_STORAGE_KEY);
    return done === "1";
  } catch (error) {
    console.warn("[appGuide] Failed to read first-guide flag:", error);
    return false;
  }
}

/**
 * Marks the first-launch App Guide as seen so it does not run again on this
 * device. Called on both natural completion and Skip/Exit — skipping still
 * counts as "seen" (the permanent hub in Profile remains the replay path).
 * Write failures are swallowed (best-effort persistence); worst case the
 * guide runs once more, which is harmless.
 */
export async function markFirstGuideSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_GUIDE_STORAGE_KEY, "1");
  } catch (error) {
    console.warn("[appGuide] Failed to persist first-guide flag:", error);
  }
}

/**
 * Clears the persisted "seen" flag and the in-memory session-attempt guard
 * (see {@link markFirstLaunchTriggerAttempted}) so the first-launch App
 * Guide behaves exactly like a fresh install again. Used by the Profile
 * "restart onboarding" test row — never called from any real user flow.
 * Write failures are swallowed (best-effort; worst case the manual
 * `startTour("firstLaunch")` call right after this still runs the tour
 * once, it just may re-run once more from Home's automatic trigger too).
 */
export async function resetFirstGuide(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FIRST_GUIDE_STORAGE_KEY);
  } catch (error) {
    console.warn("[appGuide] Failed to reset first-guide flag:", error);
  }
  firstLaunchTriggerAttempted = false;
}

/**
 * In-memory gate (mirrors `lib/homeSessionCeremony.ts`) ensuring Home only
 * ever *attempts* to trigger the first-launch App Guide once per JS
 * session. Resets on cold start; not persisted. Without this, Home
 * remounting (e.g. switching tabs and back) could re-check
 * {@link hasSeenFirstGuide} and re-start the tour while the very first
 * attempt is still in flight or was just skipped.
 */
let firstLaunchTriggerAttempted = false;

/**
 * Returns whether Home has already attempted to trigger the first-launch
 * guide during this app session.
 */
export function hasAttemptedFirstLaunchTrigger(): boolean {
  return firstLaunchTriggerAttempted;
}

/**
 * Marks the first-launch guide trigger as attempted for the remainder of
 * this session, regardless of whether it actually started (the device may
 * already have {@link hasSeenFirstGuide} `true`).
 */
export function markFirstLaunchTriggerAttempted(): void {
  firstLaunchTriggerAttempted = true;
}
