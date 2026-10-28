/**
 * Prefix-tagged Metro breadcrumbs for cold-start / reload timing.
 * Only emits in development so production builds stay quiet.
 *
 * Format: `[boot HH:MM:SS +1234ms] message`
 * Elapsed ms are relative to module load or the last {@link resetBootClock} call
 * (root `_layout` resets on each Fast Refresh / reload).
 *
 * Milestone lines also trigger a paired `[mem …]` heap snapshot via {@link logMemory}.
 *
 * Note: `memoryLog` must NOT import this module (circular: bootLog → memoryLog).
 * Clocks stay aligned via {@link resetMemoryClock} from {@link resetBootClock}.
 */

import { logMemory, resetMemoryClock } from "@/lib/memoryLog";

/** Epoch ms when the current boot / reload clock started. */
let bootOriginMs: number = Date.now();

/**
 * Milliseconds since the current boot / reload clock started.
 * Always defined; returns 0 if the clock is somehow unavailable.
 *
 * @returns Non-negative elapsed time in ms
 */
export function getBootElapsedMs(): number {
  try {
    const elapsed = Date.now() - bootOriginMs;
    if (typeof elapsed !== "number" || !Number.isFinite(elapsed)) {
      return 0;
    }
    return elapsed < 0 ? 0 : elapsed;
  } catch {
    return 0;
  }
}

/**
 * Restarts the elapsed-ms clock. Call from root layout module load so Fast
 * Refresh and Metro reloads measure from the new cycle, not an old session.
 */
export function resetBootClock(): void {
  bootOriginMs = Date.now();
  resetMemoryClock();
}

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
 * Logs a boot breadcrumb with wall clock and ms since reload start.
 *
 * @param message - Short step label after the timed `[boot …]` prefix
 * @param detail - Optional extra value (error message, etc.)
 */
export function bootLog(message: string, detail?: unknown): void {
  if (!__DEV__) {
    return;
  }

  const now = new Date();
  const elapsedMs = getBootElapsedMs();
  const prefix = `[boot ${formatWallClock(now)} +${elapsedMs}ms]`;

  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`, detail);
  }

  if (message.includes("(milestone)")) {
    logMemory(message);
  }
}
