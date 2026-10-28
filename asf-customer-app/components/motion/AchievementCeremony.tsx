/**
 * Backward-compatible alias for the Classic points ceremony.
 *
 * Prefer {@link getPointsCeremony} so Appearance themes render distinct
 * pop-ins. Direct imports keep existing call sites working.
 */
export {
  ClassicPointsCeremony as AchievementCeremony,
  type PointsCeremonyProps as AchievementCeremonyProps,
} from "./pointsCeremony";
