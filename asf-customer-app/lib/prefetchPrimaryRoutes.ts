import { router, type Href } from "expo-router";

import { logPrioIdleWarm } from "@/lib/prioLog";

/**
 * Feature gates for optional primary surfaces. Always-on tabs (Shop, Profile)
 * are prefetched regardless.
 */
export type PrefetchPrimaryRoutesOptions = {
  /** Prefetch Highlights when the feature flag is on. */
  highlights: boolean;
  /** Prefetch Stores when the feature flag is on. */
  locations: boolean;
  /** Prefetch the wishlist stack screen when the feature flag is on. */
  wishlist: boolean;
};

/** Hrefs already handed to {@link router.prefetch} this JS session. */
const prefetchedHrefs = new Set<string>();

/**
 * Builds the idle-warm prefetch list for the current feature set.
 *
 * @param options - Feature gates for optional routes
 * @returns Deduped Expo Router hrefs
 */
function buildPrefetchHrefs(options: PrefetchPrimaryRoutesOptions): Href[] {
  const hrefs: Href[] = ["/(tabs)/browse", "/(tabs)/profile"];

  if (options.highlights) {
    hrefs.push("/(tabs)/highlights");
  }
  if (options.locations) {
    hrefs.push("/(tabs)/locations");
  }
  if (options.wishlist) {
    hrefs.push("/wishlist");
  }

  return hrefs;
}

/**
 * Logs a soft prefetch failure without throwing into Home.
 *
 * @param key - Href string used for dedupe / logs
 * @param error - Sync throw or async rejection reason
 */
function logPrefetchFailure(key: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const message = error instanceof Error ? error.message : "unknown error";
  logPrioIdleWarm("routes", `prefetch failed ${key} ${message}`);
}

/**
 * Background-preloads primary tab (and optional) routes via Expo Router
 * `PRELOAD` so the first user tap does not wait on Expo Go Metro
 * `Android Bundled …ms` + first scene mount.
 *
 * Safe to call repeatedly — each href is prefetched at most once per session.
 * Failures (sync or async Metro `LoadBundleFromServerRequestError`) are
 * swallowed so idle warm never throws into Home.
 *
 * @param options - Feature gates for optional routes
 */
export function prefetchPrimaryRoutes(
  options: PrefetchPrimaryRoutesOptions
): void {
  const hrefs = buildPrefetchHrefs(options);

  for (const href of hrefs) {
    const key = typeof href === "string" ? href : String(href);
    if (prefetchedHrefs.has(key)) {
      continue;
    }
    prefetchedHrefs.add(key);

    try {
      logPrioIdleWarm("routes", `prefetch ${key}`);
      const result: unknown = router.prefetch(href);
      // Expo Router types say void, but PRELOAD may still surface a thenable
      // when `asyncRoutes` fetches a Metro chunk — catch so it is not uncaught.
      if (
        typeof result === "object" &&
        result !== null &&
        "then" in result &&
        typeof (result as { then: unknown }).then === "function"
      ) {
        void (result as Promise<unknown>).catch((error: unknown) => {
          logPrefetchFailure(key, error);
        });
      }
    } catch (error: unknown) {
      logPrefetchFailure(key, error);
    }
  }
}
