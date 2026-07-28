import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useGuide, type LayoutRect } from "./GuideContext";
import type { AnchorId } from "./tours";

/** Bounded retries while waiting for a just-mounted anchor to report a real size. */
const MAX_MEASURE_ATTEMPTS = 5;
/** Delay between measurement retries (ms). Short enough to feel instant to the user. */
const MEASURE_RETRY_DELAY_MS = 120;
/**
 * Delay (ms) before a single confirming re-measure that follows every
 * *successful* (non-zero-size) measurement. React Navigation's bottom-tabs
 * keeps every tab screen mounted and toggles inactive ones to
 * `display: "none"` — Yoga collapses their whole subtree to zero size
 * while hidden, so `measureInWindow` legitimately reports zero and the
 * retry loop above handles that case. The tricky case is the *first*
 * frame right after a tab becomes `display: "flex"` again: Yoga can
 * report a plausible, non-zero rect for a view whose ancestors (safe
 * area insets, a `ScrollView`'s resting scroll offset, async content
 * above it) haven't fully settled yet — that "succeeds" the check above
 * with a subtly wrong rect that then never gets corrected. One extra
 * re-measure shortly after the first success catches that without
 * re-entering the zero-size retry loop on every call.
 */
const SETTLE_RECHECK_DELAY_MS = 220;

/**
 * Measures `node` in window coordinates, retrying briefly if the initial
 * measurement reports a zero size (view not yet painted — common right
 * after a cross-screen tour navigation), then gives up gracefully so
 * callers can fall back to a centered card. Follows up any successful
 * measurement with one delayed re-check (see {@link SETTLE_RECHECK_DELAY_MS})
 * to catch a rect measured before its screen's layout fully settled.
 * Shared by {@link useTourAnchor} and any other anchor-style measurer
 * (e.g. `TabBarAnchorOverlay`, which registers one measured rect under
 * several anchor ids at once) so the retry policy stays consistent
 * across the engine.
 */
export function measureWindowRectWithRetry(
  node: View | null,
  onMeasured: (rect: LayoutRect) => void,
  attempt = 0,
  settleCheckDone = false,
): void {
  if (!node) {
    return;
  }
  node.measureInWindow((x: number, y: number, width: number, height: number) => {
    if (width <= 0 || height <= 0) {
      if (attempt < MAX_MEASURE_ATTEMPTS) {
        setTimeout(
          () => measureWindowRectWithRetry(node, onMeasured, attempt + 1, settleCheckDone),
          MEASURE_RETRY_DELAY_MS,
        );
      }
      return;
    }
    onMeasured({ x, y, width, height });
    if (!settleCheckDone) {
      setTimeout(
        () => measureWindowRectWithRetry(node, onMeasured, attempt, true),
        SETTLE_RECHECK_DELAY_MS,
      );
    }
  });
}

/**
 * Measures the wrapped view in window coordinates and registers its rect
 * with the coach-mark engine under `id`, re-measuring on every layout pass
 * so the spotlight tracks re-flows (orientation change, content loading).
 * Retries briefly if the initial measurement reports a zero size (view not
 * yet painted), then gives up gracefully — `GuideOverlay` falls back to a
 * centered card when no rect is ever registered.
 *
 * Returns a `ref` + `onLayout` pair to spread onto the measured native view.
 */
export function useTourAnchor(id: AnchorId): {
  ref: React.RefObject<View | null>;
  onLayout: () => void;
} {
  const { registerAnchor, unregisterAnchor, activeStep } = useGuide();
  const ref = useRef<View>(null);

  const measure = useCallback((): void => {
    measureWindowRectWithRetry(ref.current, (rect) => registerAnchor(id, rect));
  }, [id, registerAnchor]);

  const onLayout = useCallback((): void => {
    measure();
  }, [measure]);

  useEffect(() => {
    return () => {
      unregisterAnchor(id);
    };
  }, [id, unregisterAnchor]);

  /**
   * Re-measures whenever this anchor becomes the guide's active spotlight
   * target, not just on this view's own `onLayout`. `onLayout` alone only
   * fires when the anchor's *own* frame changes — it misses the case where
   * an already-mounted anchor (e.g. a tab screen React Navigation keeps
   * alive across tab switches) is holding a *stale* window rect from an
   * earlier visit (different scroll position, layout not yet settled,
   * etc). That stale rect is exactly what makes a spotlight land on empty
   * space instead of the real control. Cheap no-op when this anchor isn't
   * currently mounted (`ref.current` is null) or isn't the active target.
   *
   * This alone is *not* sufficient for anchors living on a different tab
   * than the one currently focused: `activeStep` flips the instant
   * `GuideContext` advances the tour — before `router.navigate` has
   * actually made this anchor's tab screen visible. React Navigation's
   * bottom-tabs sets inactive tab screens to `display: "none"`, so a
   * measurement taken at that exact moment can read a real, non-zero-but-
   * meaningless rect from a collapsed subtree. The `useFocusEffect` below
   * covers that case by re-measuring once this anchor's *own* screen is
   * confirmed focused, regardless of why the tour got here.
   */
  useEffect(() => {
    if (activeStep?.anchorId === id) {
      measure();
    }
  }, [activeStep, id, measure]);

  /**
   * Re-measures whenever the screen this anchor lives on gains focus —
   * the moment its window rect is guaranteed to reflect what's actually
   * on screen (see the effect above for why `activeStep` alone can fire
   * too early, while the tab is still hidden). Runs for every focus, not
   * just tour-driven ones, which is harmless: it simply keeps this
   * anchor's registered rect fresh for whenever a tour does target it.
   */
  useFocusEffect(
    useCallback(() => {
      measure();
    }, [measure]),
  );

  return { ref, onLayout };
}

export interface TourAnchorProps {
  /** Stable anchor id from {@link ANCHORS}. */
  id: AnchorId;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Transparent passthrough wrapper: registers `children`'s window rect under
 * `id` for coach-mark spotlighting. Adds no padding/flex sizing of its own —
 * only the optional caller-provided `style` — so it never changes the
 * wrapped control's layout. `collapsable={false}` keeps Android from
 * flattening the view away before it can be measured.
 */
export function TourAnchor({ id, children, style }: TourAnchorProps): React.ReactElement {
  const { ref, onLayout } = useTourAnchor(id);

  return (
    <View ref={ref} onLayout={onLayout} collapsable={false} style={style}>
      {children}
    </View>
  );
}
