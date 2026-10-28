/**
 * Design Lab preview variant ids and AsyncStorage keys.
 *
 * Staff (SUPERADMIN) pick Home hero + store-welcome options in Design Lab.
 * Pass 2/3 read these values to render variants; defaults match production.
 */

/** AsyncStorage key for the Home hero layout preview. */
export const DESIGN_PREVIEW_HERO_KEY = "asf_design_preview_hero";

/** AsyncStorage key for the store-welcome popup preview. */
export const DESIGN_PREVIEW_WELCOME_KEY = "asf_design_preview_welcome";

/** Home hero layout variant ids (production baseline + A–E). */
export const HERO_VARIANT_IDS = ["current", "a", "b", "c", "d", "e"] as const;

/**
 * Store-welcome popup variant ids (`off` = production PDP-only tap).
 *
 * Grand set (2026-09-28 Simon pass):
 * - `1` Flagship cover
 * - `2` Editorial split
 * - `3` Ceremony arrival
 * - `4` Full welcome moment (reference grandeur)
 * - `5` Lookbook gate
 */
export const WELCOME_VARIANT_IDS = ["off", "1", "2", "3", "4", "5"] as const;

/** Union of Home hero preview variant ids. */
export type HeroVariantId = (typeof HERO_VARIANT_IDS)[number];

/** Union of store-welcome preview variant ids. */
export type WelcomeVariantId = (typeof WELCOME_VARIANT_IDS)[number];

/** Default hero variant — current production Home layout. */
export const DEFAULT_HERO_VARIANT: HeroVariantId = "current";

/** Default welcome variant — no popup; keep PDP deep link. */
export const DEFAULT_WELCOME_VARIANT: WelcomeVariantId = "off";

/**
 * Type guard for persisted hero variant strings.
 */
export function isHeroVariantId(value: string | null): value is HeroVariantId {
  if (value === null) {
    return false;
  }
  return (HERO_VARIANT_IDS as readonly string[]).includes(value);
}

/**
 * Type guard for persisted welcome variant strings.
 */
export function isWelcomeVariantId(value: string | null): value is WelcomeVariantId {
  if (value === null) {
    return false;
  }
  return (WELCOME_VARIANT_IDS as readonly string[]).includes(value);
}
