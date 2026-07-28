import { atelierPack } from "@/themes/atelier";
import { classicPack } from "@/themes/classic";
import { noirPack } from "@/themes/noir";
import type { ThemeId, ThemePack } from "@/themes/types";
import { DEFAULT_THEME_ID } from "@/themes/types";

/**
 * Map of theme id → skin pack. Default / fallback is Classic.
 */
export const themeRegistry: Record<ThemeId, ThemePack> = {
  classic: classicPack,
  atelier: atelierPack,
  noir: noirPack,
};

/**
 * Resolves a theme pack from the registry, falling back to Classic.
 */
export function getThemePack(themeId: ThemeId): ThemePack {
  const pack = themeRegistry[themeId];
  if (pack === undefined) {
    return themeRegistry[DEFAULT_THEME_ID];
  }
  return pack;
}
