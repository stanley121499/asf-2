import type { RealtimeChannel } from "@supabase/supabase-js";

import { scheduleAfterIdle } from "@/lib/scheduleAfterIdle";

/**
 * Extra pause after first idle tick before opening non-critical Realtime
 * channels. Keeps cold-start JS + first paint from competing with ~N WebSockets.
 */
export const DEFAULT_REALTIME_DEFER_MS = 750;

/**
 * Schedules opening a Supabase Realtime channel after the UI is idle,
 * plus an optional delay. Returns a cleanup that cancels a pending open and
 * unsubscribes if the channel was already created.
 *
 * @param openChannel - Factory that creates and `.subscribe()`s a channel.
 * @param deferMs - Milliseconds after idle before opening (default
 *   {@link DEFAULT_REALTIME_DEFER_MS}).
 * @returns Cleanup function safe to call from a React effect teardown.
 */
export function scheduleDeferredRealtime(
  openChannel: () => RealtimeChannel,
  deferMs: number = DEFAULT_REALTIME_DEFER_MS,
): () => void {
  let cancelled = false;
  let channel: RealtimeChannel | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const idleHandle = scheduleAfterIdle(() => {
    if (cancelled) {
      return;
    }
    const delay = Number.isFinite(deferMs)
      ? Math.max(0, deferMs)
      : DEFAULT_REALTIME_DEFER_MS;
    timeoutId = setTimeout(() => {
      if (cancelled) {
        return;
      }
      channel = openChannel();
    }, delay);
  });

  return () => {
    cancelled = true;
    idleHandle.cancel();
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (channel !== null) {
      channel.unsubscribe();
      channel = null;
    }
  };
}
