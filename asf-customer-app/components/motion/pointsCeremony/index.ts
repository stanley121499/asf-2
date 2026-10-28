/**
 * Theme-aware discovery-points pop-in ceremonies.
 *
 * Prefer {@link getPointsCeremony} at award call sites so Appearance theme
 * switches change the ceremony personality, not only colors.
 */
export { AtelierPointsCeremony } from "./AtelierPointsCeremony";
export { ClassicPointsCeremony } from "./ClassicPointsCeremony";
export { getPointsCeremony } from "./getPointsCeremony";
export { NoirPointsCeremony } from "./NoirPointsCeremony";
export { StorefrontPointsCeremony } from "./StorefrontPointsCeremony";
export type {
  PointsCeremonyComponent,
  PointsCeremonyProps,
} from "./types";
