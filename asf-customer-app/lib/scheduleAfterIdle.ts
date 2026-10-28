/**
 * Soft replacement for deprecated `InteractionManager.runAfterInteractions`.
 * Prefers `requestIdleCallback` when available; otherwise a short `setTimeout`.
 */

export type IdleScheduleHandle = {
  /** Cancels a pending idle callback so it never runs. */
  cancel: () => void;
};

type IdleCallbackGlobal = {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Runs `callback` after the current frame / when the event loop is idle.
 * Keeps deferred boot work (realtime, native registrars) off the first paint path.
 *
 * @param callback - Work to run once the UI is idle (or after a short fallback delay)
 * @param fallbackDelayMs - `setTimeout` delay when `requestIdleCallback` is missing
 * @returns Handle with `cancel` for effect teardown
 */
export function scheduleAfterIdle(
  callback: () => void,
  fallbackDelayMs: number = 1,
): IdleScheduleHandle {
  const idleGlobal = globalThis as IdleCallbackGlobal;

  if (typeof idleGlobal.requestIdleCallback === "function") {
    const idleId = idleGlobal.requestIdleCallback(
      () => {
        callback();
      },
      { timeout: 2000 },
    );
    return {
      cancel: (): void => {
        if (typeof idleGlobal.cancelIdleCallback === "function") {
          idleGlobal.cancelIdleCallback(idleId);
        }
      },
    };
  }

  const timeoutId = setTimeout(() => {
    callback();
  }, Math.max(0, fallbackDelayMs));

  return {
    cancel: (): void => {
      clearTimeout(timeoutId);
    },
  };
}
