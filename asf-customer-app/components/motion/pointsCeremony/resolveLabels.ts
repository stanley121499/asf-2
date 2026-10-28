import type { PointsCeremonyProps } from "./types";

/**
 * Resolves display strings for a points ceremony from optional i18n props.
 *
 * @param points - Awarded point count.
 * @param titleLabel - Optional eyebrow copy.
 * @param pointsLabel - Optional body copy.
 * @returns Trimmed title and points line ready for render.
 */
export function resolveCeremonyLabels(
  points: number,
  titleLabel: PointsCeremonyProps["titleLabel"],
  pointsLabel: PointsCeremonyProps["pointsLabel"]
): { title: string; pointsLine: string } {
  const title =
    typeof titleLabel === "string" && titleLabel.trim().length > 0
      ? titleLabel.trim()
      : "Points earned";

  const pointsLine =
    typeof pointsLabel === "string" && pointsLabel.trim().length > 0
      ? pointsLabel.trim()
      : `+${points}`;

  return { title, pointsLine };
}

/**
 * Resolves hold duration, falling back to a non-negative default.
 *
 * @param holdMs - Optional override from the call site.
 * @param fallbackMs - Theme or shared default hold.
 */
export function resolveHoldMs(holdMs: number | undefined, fallbackMs: number): number {
  if (typeof holdMs === "number" && Number.isFinite(holdMs) && holdMs >= 0) {
    return holdMs;
  }
  return fallbackMs;
}

/**
 * Builds an accessibility label from ceremony copy.
 *
 * @param accessibilityLabel - Optional override.
 * @param title - Resolved eyebrow.
 * @param pointsLine - Resolved points body.
 */
export function resolveA11yLabel(
  accessibilityLabel: string | undefined,
  title: string,
  pointsLine: string
): string {
  if (
    typeof accessibilityLabel === "string" &&
    accessibilityLabel.trim().length > 0
  ) {
    return accessibilityLabel.trim();
  }
  return [title, pointsLine].join(". ");
}
