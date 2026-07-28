import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "expo-router";

import { markFirstGuideSeen } from "@/lib/appGuide";

import { TOURS, type AnchorId, type GuideStep, type GuideTour } from "./tours";

/** Stable id of the automatic first-launch orientation tour (see `tours.ts`). */
export const FIRST_LAUNCH_TOUR_ID = "firstLaunch";

/** Window-space rect of a spotlighted anchor, as reported by `measureInWindow`. */
export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Public API of the coach-mark engine, exposed via {@link useGuide}. */
export interface GuideContextValue {
  /** Id of the tour currently running, or `null` when no tour is active. */
  activeTourId: string | null;
  /** Zero-based index of the current step within the active tour. */
  stepIndex: number;
  /** Registered window rects for every mounted `TourAnchor`, keyed by anchor id. */
  anchors: Partial<Record<AnchorId, LayoutRect>>;
  /** The active tour definition, or `undefined` when no tour is active. */
  activeTour: GuideTour | undefined;
  /** The active step definition, or `undefined` when no tour is active. */
  activeStep: GuideStep | undefined;
  /** True when `stepIndex` is the first step of the active tour. */
  isFirst: boolean;
  /** True when `stepIndex` is the last step of the active tour (or no tour is active). */
  isLast: boolean;
  /** Total step count of the active tour (0 when no tour is active). */
  totalSteps: number;
  /**
   * Starts a tour by id. No-ops (with a `__DEV__` warning) when the tour is
   * missing or has no steps, so hub cards can safely call this before every
   * tour is populated by later agents.
   */
  startTour: (id: string) => void;
  /** Advances to the next step, or finishes (exits) the tour from the last step. */
  next: () => void;
  /** Returns to the previous step. No-op on the first step. */
  back: () => void;
  /**
   * Exits the active tour immediately (Skip / Exit guide, or the internal
   * finish path from the last step's Next/Done). Pass `{ completed: true }`
   * only for a natural finish — when the tour being exited is the
   * `firstLaunch` orientation, this additionally navigates back to Home
   * (plan §5.4 step 6, "Got it" → Home). Exiting `firstLaunch` for *any*
   * reason (skip or finish) persists `markFirstGuideSeen()` so it never
   * runs again on this device.
   */
  exit: (options?: { completed?: boolean }) => void;
  /** Registers (or updates) the window rect for an anchor id. */
  registerAnchor: (id: AnchorId, rect: LayoutRect) => void;
  /** Clears the rect for an anchor id (called on `TourAnchor` unmount). */
  unregisterAnchor: (id: AnchorId) => void;
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined);

/**
 * Strips expo-router route-group segments (e.g. `(tabs)`, `(auth)`) from a
 * `Href`-style path string. Route groups organize files on disk but never
 * appear in the resolved URL, so `usePathname()` never includes them —
 * comparing a raw step `route` like `"/(tabs)/browse"` against `pathname`
 * (`"/browse"`) would otherwise always mismatch and re-trigger navigation
 * on every render. Also collapses repeated slashes and drops a trailing
 * slash (except for the root `"/"`), matching `usePathname()`'s output.
 */
function stripRouteGroups(path: string): string {
  const withoutGroups = path
    .split("/")
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .join("/");
  const collapsed = withoutGroups.replace(/\/+/g, "/");
  if (collapsed.length === 0) {
    return "/";
  }
  return collapsed.length > 1 && collapsed.endsWith("/")
    ? collapsed.slice(0, -1)
    : collapsed;
}

/**
 * Provides the app-wide coach-mark engine: active tour/step state, the
 * anchor-rect registry, and cross-screen navigation for steps that declare
 * a `route`. Mount once near the root (see `app/_layout.tsx`), above
 * `GuideOverlay` and inside providers that expose locale + router.
 */
export function GuideProvider({ children }: PropsWithChildren): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchors, setAnchors] = useState<Partial<Record<AnchorId, LayoutRect>>>({});

  const activeTour = activeTourId ? TOURS[activeTourId] : undefined;
  const totalSteps = activeTour?.steps.length ?? 0;
  const activeStep = activeTour?.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = totalSteps === 0 || stepIndex === totalSteps - 1;

  const exit = useCallback(
    (options?: { completed?: boolean }): void => {
      if (activeTourId === FIRST_LAUNCH_TOUR_ID) {
        void markFirstGuideSeen();
        if (options?.completed === true) {
          router.navigate("/(tabs)/");
        }
      }
      setActiveTourId(null);
      setStepIndex(0);
    },
    [activeTourId, router],
  );

  const startTour = useCallback((id: string): void => {
    const tour = TOURS[id];
    if (!tour || tour.steps.length === 0) {
      if (__DEV__) {
        console.warn(`[guide] Cannot start tour "${id}": not found or has no steps.`);
      }
      return;
    }
    setActiveTourId(id);
    setStepIndex(0);
  }, []);

  const next = useCallback((): void => {
    setStepIndex((current) => {
      const tour = activeTourId ? TOURS[activeTourId] : undefined;
      if (!tour) {
        return current;
      }
      if (current >= tour.steps.length - 1) {
        return current;
      }
      return current + 1;
    });
  }, [activeTourId]);

  const back = useCallback((): void => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const registerAnchor = useCallback((id: AnchorId, rect: LayoutRect): void => {
    setAnchors((current) => ({ ...current, [id]: rect }));
  }, []);

  const unregisterAnchor = useCallback((id: AnchorId): void => {
    setAnchors((current) => {
      if (!(id in current)) {
        return current;
      }
      const nextAnchors = { ...current };
      delete nextAnchors[id];
      return nextAnchors;
    });
  }, []);

  /**
   * `next()` finishes the tour (exits) when called from the last step,
   * rather than advancing `stepIndex` past the end. Implemented as a
   * wrapper so `next` itself stays a stable, side-effect-light setter.
   */
  const advance = useCallback((): void => {
    if (!activeTour) {
      return;
    }
    if (isLast) {
      exit({ completed: true });
      return;
    }
    next();
  }, [activeTour, isLast, exit, next]);

  /**
   * Cross-screen navigation: whenever the active step declares a `route`
   * different from the current screen, navigate there before the overlay
   * attempts to spotlight its anchor. Runs for the first step of a newly
   * started tour and for every subsequent Next/Back landing on a routed
   * step (including navigating *back* to an earlier step's route).
   *
   * Steps with no `route` are left alone — the tour just waits on whatever
   * screen the user is currently on (e.g. `chooseSizeAddToBag` asks the
   * user to open a shoe themselves rather than deep-linking to one).
   *
   * Uses `router.navigate` (not `push`) so re-entering a route the user is
   * already on reuses the existing screen instance instead of stacking a
   * duplicate — matching the convention used elsewhere in the app (see
   * `lib/browseNavigation.ts`).
   */
  useEffect(() => {
    if (!activeStep?.route) {
      return;
    }
    if (stripRouteGroups(activeStep.route) === pathname) {
      return;
    }
    router.navigate(activeStep.route);
  }, [activeStep, pathname, router]);

  const value = useMemo<GuideContextValue>(
    () => ({
      activeTourId,
      stepIndex,
      anchors,
      activeTour,
      activeStep,
      isFirst,
      isLast,
      totalSteps,
      startTour,
      next: advance,
      back,
      exit,
      registerAnchor,
      unregisterAnchor,
    }),
    [
      activeTourId,
      stepIndex,
      anchors,
      activeTour,
      activeStep,
      isFirst,
      isLast,
      totalSteps,
      startTour,
      advance,
      back,
      exit,
      registerAnchor,
      unregisterAnchor,
    ],
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

/**
 * Hook to read/drive the coach-mark engine. Must be used inside {@link GuideProvider}.
 */
export function useGuide(): GuideContextValue {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
}
