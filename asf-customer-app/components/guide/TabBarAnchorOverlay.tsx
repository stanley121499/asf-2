import React, { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";

import { useGuide, type LayoutRect } from "./GuideContext";
import { measureWindowRectWithRetry } from "./TourAnchor";
import type { AnchorId } from "./tours";

export interface TabBarAnchorOverlayProps {
  /**
   * Anchor ids to register with the measured tab-bar rect — pass only the
   * ids for tabs that are currently visible (e.g. skip `tabbar.highlights`
   * while the `highlights` feature flag is off).
   */
  anchorIds: readonly AnchorId[];
  /** Total tab bar height (row height + bottom safe-area inset) to size the overlay. */
  height: number;
}

/**
 * Fallback tab-bar instrumentation (plan §7): `Tabs` (via
 * `@react-navigation/bottom-tabs`) renders each tab button internally, so
 * wrapping individual tab buttons in `TourAnchor` would require
 * reimplementing `tabBarButton` and risks regressing tab press behavior.
 * Instead, this transparent, non-interactive overlay measures the whole
 * tab bar once and registers that single rect under every currently
 * visible tab anchor id, so any `ANCHORS.tabbar.*` step spotlights the
 * real bar — the step's body copy names the specific tab in words.
 *
 * Mount once as an absolutely-positioned sibling of `<Tabs>`, pinned to
 * the bottom of the tab screen container.
 */
export function TabBarAnchorOverlay({
  anchorIds,
  height,
}: TabBarAnchorOverlayProps): React.ReactElement {
  const { registerAnchor, unregisterAnchor, activeStep } = useGuide();
  const ref = useRef<View>(null);

  const handleMeasured = useCallback(
    (rect: LayoutRect): void => {
      for (const id of anchorIds) {
        registerAnchor(id, rect);
      }
    },
    [anchorIds, registerAnchor],
  );

  const measure = useCallback((): void => {
    measureWindowRectWithRetry(ref.current, handleMeasured);
  }, [handleMeasured]);

  const onLayout = useCallback((): void => {
    measure();
  }, [measure]);

  useEffect(() => {
    return () => {
      for (const id of anchorIds) {
        unregisterAnchor(id);
      }
    };
  }, [anchorIds, unregisterAnchor]);

  /** See the matching effect in `useTourAnchor` — same stale-rect fix, applied to whichever tab anchor is currently active. */
  useEffect(() => {
    if (activeStep?.anchorId && anchorIds.includes(activeStep.anchorId)) {
      measure();
    }
  }, [activeStep, anchorIds, measure]);

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      collapsable={false}
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, height }}
    />
  );
}
