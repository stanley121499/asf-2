import type { ThemeId } from "@/themes/types";

import { AtelierPointsCeremony } from "./AtelierPointsCeremony";
import { ClassicPointsCeremony } from "./ClassicPointsCeremony";
import { NoirPointsCeremony } from "./NoirPointsCeremony";
import { StorefrontPointsCeremony } from "./StorefrontPointsCeremony";
import type { PointsCeremonyComponent } from "./types";

/**
 * Resolves the discovery-points pop-in component for a theme pack.
 *
 * Each theme ships a distinct personality (strip / editorial plate / blade /
 * pride pulse) — not just a recolored banner.
 *
 * @param themeId - Active Appearance theme id.
 * @returns Ceremony component for `themeId` (Classic fallback for invalid ids).
 */
export function getPointsCeremony(themeId: ThemeId): PointsCeremonyComponent {
  switch (themeId) {
    case "classic":
      return ClassicPointsCeremony;
    case "atelier":
      return AtelierPointsCeremony;
    case "noir":
      return NoirPointsCeremony;
    case "storefront":
      return StorefrontPointsCeremony;
    default: {
      const _exhaustive: never = themeId;
      void _exhaustive;
      return ClassicPointsCeremony;
    }
  }
}
