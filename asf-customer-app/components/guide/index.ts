/**
 * Reusable coach-mark / spotlight engine for the App Guide feature.
 * Mount `GuideProvider` + `GuideOverlay` once near the app root; screens
 * wrap real controls in `TourAnchor` and call `useGuide().startTour(id)`.
 */
export {
  FIRST_LAUNCH_TOUR_ID,
  GuideProvider,
  useGuide,
  type GuideContextValue,
  type LayoutRect,
} from "./GuideContext";
export { GuideOverlay } from "./GuideOverlay";
export {
  TourAnchor,
  measureWindowRectWithRetry,
  useTourAnchor,
  type TourAnchorProps,
} from "./TourAnchor";
export { TabBarAnchorOverlay, type TabBarAnchorOverlayProps } from "./TabBarAnchorOverlay";
export {
  ANCHORS,
  HUB_TOPIC_ORDER,
  TOURS,
  type AnchorId,
  type GuidePlacement,
  type GuideStep,
  type GuideTour,
  type IoniconName,
} from "./tours";
