/**
 * Dev-only priority-loading breadcrumbs (`[prio] P0|P1|P2|P3 …`).
 * No-ops in production so Metro stays quiet on release builds.
 */

/**
 * Logs a P2 focus event when a heavy resource becomes active for a route.
 *
 * @param name - Short resource id (`wishlist`, `claims`, …)
 */
export function logPrioP2Focus(name: string): void {
  if (__DEV__) {
    console.log(`[prio] P2 focus ${name}`);
  }
}

/**
 * Logs a P2 blur event when the last focused consumer releases a resource.
 *
 * @param name - Short resource id (`wishlist`, `claims`, …)
 */
export function logPrioP2Blur(name: string): void {
  if (__DEV__) {
    console.log(`[prio] P2 blur ${name}`);
  }
}

/**
 * Logs when a P2 retain re-focus skips network work because data is still fresh.
 *
 * @param name - Short resource id (`promotions`, `wishlist`, …)
 * @param detail - Optional age / TTL note
 */
export function logPrioP2Skip(name: string, detail?: string): void {
  if (!__DEV__) {
    return;
  }
  if (typeof detail === "string" && detail.length > 0) {
    console.log(`[prio] P2 skip ${name} ${detail}`);
    return;
  }
  console.log(`[prio] P2 skip ${name}`);
}

/**
 * Logs when a P2 retain starts a network fetch.
 *
 * @param name - Short resource id
 * @param detail - Optional mode note (`silent`, `blocking`, …)
 */
export function logPrioP2Fetch(name: string, detail?: string): void {
  if (!__DEV__) {
    return;
  }
  if (typeof detail === "string" && detail.length > 0) {
    console.log(`[prio] P2 fetch ${name} ${detail}`);
    return;
  }
  console.log(`[prio] P2 fetch ${name}`);
}

/**
 * Logs idle warm-next pass breadcrumbs (`start` / `done` / step skips).
 *
 * @param phase - Warm pass lifecycle or step label
 * @param detail - Optional structured note (counts, skip reason)
 */
export function logPrioIdleWarm(phase: string, detail?: string): void {
  if (!__DEV__) {
    return;
  }
  if (typeof detail === "string" && detail.length > 0) {
    console.log(`[prio] idle warm ${phase} ${detail}`);
    return;
  }
  console.log(`[prio] idle warm ${phase}`);
}
