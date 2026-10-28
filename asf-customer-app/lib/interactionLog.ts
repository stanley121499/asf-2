/**
 * Prefix-tagged Metro breadcrumbs for tap → navigate → focus latency.
 * Only emits in development so production APKs stay quiet.
 *
 * Grep Metro for `[tap]` (press) or `[nav]` (route change / focus).
 *
 * Format examples:
 *   `[tap 18:42:01 +0ms] press start product-tile:abc`
 *   `[tap 18:42:01 +12ms] onPress fired product-tile:abc`
 *   `[nav 18:42:01 +45ms] navigate start /(tabs)/browse/[productId]`
 *   `[nav 18:42:02 +1200ms] screen focused /browse/abc`  (large delta = lag)
 *
 * Elapsed ms are relative to the latest {@link markTapStart} call. When no
 * press origin exists yet, deltas are reported as `+?ms`.
 */

/** Epoch ms of the most recent press-start (or `null` before any tap). */
let tapOriginMs: number | null = null;

/** Last press label (for correlating later nav/focus lines). */
let lastTapLabel: string = "";

/**
 * Formats local wall-clock time as `HH:MM:SS` for Metro log lines.
 *
 * @param date - Instant to format
 * @returns Zero-padded 24h time string
 */
function formatWallClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Milliseconds since the current tap origin, or `null` when no press started.
 *
 * @returns Non-negative elapsed ms, or `null`
 */
function getTapElapsedMs(): number | null {
  if (tapOriginMs === null) {
    return null;
  }
  try {
    const elapsed = Date.now() - tapOriginMs;
    if (typeof elapsed !== "number" || !Number.isFinite(elapsed)) {
      return null;
    }
    return elapsed < 0 ? 0 : elapsed;
  } catch {
    return null;
  }
}

/**
 * Builds a greppable timed prefix for Metro.
 *
 * @param tag - `"tap"` for press lifecycle, `"nav"` for routing / focus
 * @returns Prefix like `[tap 18:42:01 +45ms]`
 */
function timedPrefix(tag: "tap" | "nav"): string {
  const now = new Date();
  const elapsed = getTapElapsedMs();
  const delta =
    elapsed === null ? "+?ms" : `+${Math.round(elapsed)}ms`;
  return `[${tag} ${formatWallClock(now)} ${delta}]`;
}

/**
 * Emits a `[tap]` line. No-op outside `__DEV__`.
 *
 * @param message - Short step label after the timed prefix
 * @param detail - Optional extra value
 */
function emitTap(message: string, detail?: unknown): void {
  if (!__DEV__) {
    return;
  }
  const prefix = timedPrefix("tap");
  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`, detail);
  }
}

/**
 * Emits a `[nav]` line. No-op outside `__DEV__`.
 *
 * @param message - Short step label after the timed prefix
 * @param detail - Optional extra value
 */
function emitNav(message: string, detail?: unknown): void {
  if (!__DEV__) {
    return;
  }
  const prefix = timedPrefix("nav");
  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`, detail);
  }
}

/**
 * Starts (or restarts) the tap clock and logs `[tap +0ms] press start …`.
 * Call from press-in / gesture begin via `runOnJS` so UI-thread feedback
 * is never blocked by logging.
 *
 * @param label - Greppable surface id (e.g. `product-tile:<id>`, `tab:home`)
 */
export function markTapStart(label: string): void {
  if (!__DEV__) {
    return;
  }
  const safeLabel =
    typeof label === "string" && label.trim().length > 0
      ? label.trim()
      : "unknown";
  tapOriginMs = Date.now();
  lastTapLabel = safeLabel;
  emitTap(`press start ${safeLabel}`);
}

/**
 * Logs when the JS `onPress` handler actually runs (after gesture success
 * or deferred frame). Large gap from press start ⇒ JS thread contention.
 *
 * @param label - Optional override; defaults to the last {@link markTapStart} label
 */
export function logTapPressFired(label?: string): void {
  if (!__DEV__) {
    return;
  }
  const safe =
    typeof label === "string" && label.trim().length > 0
      ? label.trim()
      : lastTapLabel.length > 0
        ? lastTapLabel
        : "unknown";
  emitTap(`onPress fired ${safe}`);
}

/**
 * Logs when navigation is about to start (router.push / navigate / tab switch).
 *
 * @param route - Route or tab id being opened
 */
export function logNavigateStart(route: string): void {
  if (!__DEV__) {
    return;
  }
  const safeRoute =
    typeof route === "string" && route.trim().length > 0
      ? route.trim()
      : "unknown";
  emitNav(`navigate start ${safeRoute}`);
}

/**
 * Logs when a screen becomes focused / pathname settles after navigation.
 * A multi-hundred-ms (or 1–2s) delta from press start is the lag signal.
 *
 * @param route - Focused pathname or route name
 */
export function logScreenFocused(route: string): void {
  if (!__DEV__) {
    return;
  }
  const safeRoute =
    typeof route === "string" && route.trim().length > 0
      ? route.trim()
      : "unknown";
  emitNav(`screen focused ${safeRoute}`);
}

/**
 * @returns The most recent tap label, or empty string when none.
 */
export function getLastTapLabel(): string {
  return lastTapLabel;
}

/**
 * Formats the current tap-clock delta for inline breadcrumbs
 * (e.g. `+1554ms` or `+?ms` when no press origin exists).
 *
 * @returns Greppable delta string
 */
export function getTapElapsedMsLabel(): string {
  const elapsed = getTapElapsedMs();
  if (elapsed === null) {
    return "+?ms";
  }
  return `+${String(Math.round(elapsed))}ms`;
}
