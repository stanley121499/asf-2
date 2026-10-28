import { usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";

/**
 * SDK 58 `usePreventRemove` wrapper for screens that redirect hardware/back
 * gestures to a custom destination (home / wishlist / cross-tab inbox entry)
 * while still allowing non-back removals (tab resets, etc.) to proceed.
 *
 * Expo Router 58 requires clearing prevention via `disablePrevention` /
 * `repeat` instead of re-dispatching `data.action` while the prevent flag
 * remains true.
 *
 * @param shouldIntercept - When true, intercept GO_BACK / POP
 * @param onInterceptedBack - Custom leave navigation for intercepted backs
 */
export function useInterceptedBackPrevention(
  shouldIntercept: boolean,
  onInterceptedBack: () => void,
): void {
  const [preventRemove, setPreventRemove] = useState(shouldIntercept);
  const onInterceptedBackRef = useRef(onInterceptedBack);
  const disablePreventionRef = useRef<() => void>(() => {});

  onInterceptedBackRef.current = onInterceptedBack;

  useEffect(() => {
    setPreventRemove(shouldIntercept);
  }, [shouldIntercept]);

  const disablePrevention = usePreventRemove(preventRemove, ({ data, repeat }) => {
    const actionType = data.action.type;
    if (actionType === "GO_BACK" || actionType === "POP") {
      setPreventRemove(false);
      disablePreventionRef.current();
      onInterceptedBackRef.current();
      return;
    }
    setPreventRemove(false);
    repeat();
  });

  disablePreventionRef.current = disablePrevention;
}
