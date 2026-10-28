import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { logPrioP2Blur, logPrioP2Focus } from "@/lib/prioLog";
import { scheduleAfterIdle } from "@/lib/scheduleAfterIdle";

/**
 * Retains a P2 provider sync while the hosting screen is focused.
 * Calls `retainFocus()` after interactions settle (not synchronously inside
 * the navigation focus event) so tab switches can commit / unfreeze first —
 * otherwise Home's retain `setState` competes with the navigate→focus path.
 * Runs the returned releaser on blur / unmount.
 *
 * Must be used from a screen/component inside a React Navigation tree —
 * not from root providers above the navigator.
 *
 * @param name - Greppable resource label for `[prio] P2 focus|blur` logs
 * @param retainFocus - Provider retain API; returns a one-shot releaser
 */
export function useP2FocusRetain(
  name: string,
  retainFocus: () => () => void
): void {
  useFocusEffect(
    useCallback(() => {
      logPrioP2Focus(name);
      let released = false;
      let release: (() => void) | undefined;
      let cancelled = false;

      const idleHandle = scheduleAfterIdle(() => {
        if (cancelled) {
          return;
        }
        release = retainFocus();
      });

      return () => {
        cancelled = true;
        idleHandle.cancel();
        logPrioP2Blur(name);
        if (!released && release !== undefined) {
          released = true;
          release();
        }
      };
    }, [name, retainFocus])
  );
}
