/**
 * Tracks recent user interaction so background work (catalog hydrate, heavy
 * state commits) can pause and leave the JS thread free for tap feedback.
 *
 * Mid-range Android feels “1–2s per click” when a full catalog `setState`
 * lands while the user is scrolling or tapping — this gate delays those
 * commits until fingers are idle.
 */

/** Epoch ms until which the app should treat the user as actively interacting. */
let busyUntilMs = 0;

/** Optional listeners notified when busy window is extended (tests / diagnostics). */
const listeners = new Set<() => void>();

/**
 * Marks the user as busy for at least `durationMs` from now.
 * Overlapping calls extend the window (take the later deadline).
 *
 * @param durationMs - How long to keep the busy flag (default 900ms).
 */
export function markInteractionBusy(durationMs = 900): void {
  const safeDuration =
    typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0
      ? durationMs
      : 900;
  const nextUntil = Date.now() + safeDuration;
  if (nextUntil > busyUntilMs) {
    busyUntilMs = nextUntil;
  }
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * @returns True when a recent tap/scroll is still inside the busy window.
 */
export function isInteractionBusy(): boolean {
  return Date.now() < busyUntilMs;
}

/**
 * Resolves once {@link isInteractionBusy} is false. Polls lightly so hydrate
 * loops do not spin the JS thread.
 *
 * @param pollMs - Delay between idle checks (default 350ms).
 * @param signal - Optional abort — rejects with `Error("aborted")` when cancelled.
 */
export function waitForInteractionIdle(
  pollMs = 350,
  signal?: { cancelled: boolean }
): Promise<void> {
  const safePoll =
    typeof pollMs === "number" && Number.isFinite(pollMs) && pollMs >= 50
      ? pollMs
      : 350;

  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (signal?.cancelled === true) {
        reject(new Error("aborted"));
        return;
      }
      if (!isInteractionBusy()) {
        resolve();
        return;
      }
      setTimeout(tick, safePoll);
    };
    tick();
  });
}

/**
 * Schedules `fn` on the next animation frame so press opacity/scale can paint
 * before navigation / heavy JS. Also extends the interaction busy window.
 *
 * @param fn - Work to run after the frame (navigation, setState, etc.).
 * @param busyMs - Busy window duration (default 900ms).
 */
export function deferAfterPressFeedback(fn: () => void, busyMs = 900): void {
  markInteractionBusy(busyMs);
  requestAnimationFrame(() => {
    fn();
  });
}
