/**
 * Layout tokens for Design Lab Home hero / category variants (Pass 2).
 *
 * Round 4 tall cover remains the grandeur target for A/C entry; do not
 * reintroduce Round 3 short Frame 1 packing as the production baseline.
 */

import {
  frame1CoverMediaHeight,
  getHomeUsableHeight,
} from "@/lib/homeLayout";
import type { HeroVariantId } from "@/lib/designPreview";
import { STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT } from "@/components/storefront/StorefrontHomeCategoryRail";

/**
 * Current production Storefront hero as a fraction of usable height.
 * Baseline was 0.5; scaled to 0.75 so live/`current` media is ~1.5×
 * prior production height (50% taller). Variants A–D keep their own
 * scales and are unaffected.
 */
export const HERO_VARIANT_CURRENT_USABLE_FRACTION = 0.75;

/** Variant B tall hero as a fraction of usable height (~75–90%). */
export const HERO_VARIANT_B_USABLE_FRACTION = 0.85;

/** Variant D mood hero as a fraction of usable height. */
export const HERO_VARIANT_D_USABLE_FRACTION = 0.75;

/**
 * Variant A cover scale vs prior full Round 4 + bleed height (~4/5 prior).
 * Applied after bleed-under-nav math so under-nav chrome still bleeds.
 */
export const HERO_VARIANT_A_HEIGHT_SCALE = 0.8;

/** Collapsed thin media strip height for variant C (px). */
export const HERO_VARIANT_C_COLLAPSED_STRIP = 72;

/** Minimum readable hero media height on short phones. */
export const HERO_VARIANT_MEDIA_MIN = 160;

/** Horizontal padding shared with Storefront Home shells. */
export const HERO_VARIANT_HORIZONTAL_PADDING = 16;

/** Glass / scrim fill behind overlay category chips (variant B). */
export const HERO_OVERLAY_SCRIM = "rgba(10, 10, 10, 0.42)";

/** Soft top fade above overlay chips so media remains readable. */
export const HERO_OVERLAY_SCRIM_FADE = "rgba(10, 10, 10, 0.18)";

/**
 * Immersive nav veil for variants A / D / E (cover bleeds under transparent
 * chrome). Single uniform frost across status bar + category/nav chrome —
 * no stepped bands (those produced a visible horizontal seam).
 * Keeps dark storefront icons + labels readable on light or dark cover media.
 */
export const HERO_A_NAV_SCRIM = "rgba(255, 255, 255, 0.42)";

/**
 * Extra media height so a bleed cover still fills the first viewport after
 * extending upward behind transparent chrome (`topInset` + in-flow nav).
 *
 * @param topInset - Safe-area top inset.
 * @param inFlowHeaderHeight - Nav row (and optional rail) under the inset.
 * @returns Non-negative integer px to add to the below-chrome media height.
 */
function heroBleedUnderTopNavExtraHeight(
  topInset: number,
  inFlowHeaderHeight: number
): number {
  const safeTop = Number.isFinite(topInset) ? Math.max(0, topInset) : 0;
  const safeInFlow = Number.isFinite(inFlowHeaderHeight)
    ? Math.max(0, inFlowHeaderHeight)
    : 0;
  return Math.round(safeTop + safeInFlow);
}

/**
 * True when the variant places categories outside the fixed chrome rail
 * (overlay, below-fold, sticky, or mood rail under hero).
 *
 * Variant `e` keeps production fixed-rail categories (like `current`).
 */
export function heroVariantUsesExternalCategories(
  variant: HeroVariantId
): boolean {
  return variant !== "current" && variant !== "e";
}

/**
 * True when fixed chrome should omit the category rail (variants A–D).
 */
export function heroVariantHidesFixedCategoryRail(
  variant: HeroVariantId
): boolean {
  return heroVariantUsesExternalCategories(variant);
}

/**
 * True when Storefront Home should omit search / notification / cart chrome.
 *
 * Variant `e` only — Shop, PDP, Highlights, Profile, Locations, etc. keep
 * {@link StorefrontHeaderActions} unchanged.
 *
 * @param variant - Active Design Lab hero variant id.
 * @returns Whether Home fixed chrome should hide header action icons.
 */
export function heroVariantHidesHomeHeaderActions(
  variant: HeroVariantId
): boolean {
  return variant === "e";
}

/**
 * True when Home **See all** list screens should show a Home-style kind
 * category rail and filter the list in place (variant E).
 *
 * Covers:
 * - `/(tabs)/browse/product-list` — arrivals / catalog See all
 * - `/(tabs)/browse/linked-products` — post / promo See all
 *
 * @param variant - Active Design Lab hero variant id.
 * @returns Whether those routes mount the kind rail.
 */
export function heroVariantShowsLinkedProductsCategoryRail(
  variant: HeroVariantId
): boolean {
  return variant === "e";
}

/**
 * True when the cover should extend edge-to-edge under the fixed top nav
 * (transparent chrome + zero list `paddingTop` while a hero is present).
 *
 * Variants A (grandeur), D (mood), and E (production v2) share immersive
 * under-nav bleed; `current` / B / C keep content starting below chrome.
 *
 * @param variant - Active Design Lab hero variant id.
 * @returns Whether Home should bleed cover media under top chrome.
 */
export function heroVariantBleedsUnderTopNav(
  variant: HeroVariantId
): boolean {
  return variant === "a" || variant === "d" || variant === "e";
}

/**
 * Inputs for {@link resolveHeroVariantMediaHeight}.
 */
export type ResolveHeroVariantMediaHeightParams = {
  variant: HeroVariantId;
  windowHeight: number;
  topInset: number;
  bottomInset: number;
  /**
   * In-flow chrome under the status bar (nav row, optionally + category rail
   * for `current`). Variants A–D typically pass nav-only height.
   */
  inFlowHeaderHeight: number;
  /** Whether a hero candidate exists; `false` → height 0. */
  hasHero: boolean;
  /**
   * Variants A / D / E: when true, media height includes the under-nav bleed
   * band (`topInset` + `inFlowHeaderHeight`) so the cover still fills the
   * first viewport after extending upward behind transparent chrome.
   */
  bleedUnderTopNav?: boolean;
};

/**
 * Resolves the on-load hero media height for a Design Lab variant.
 *
 * - `current` / `e` — production ~¾ usable (1.5× prior ½-usable baseline).
 * - `e` + `bleedUnderTopNav` — same band plus under-chrome bleed height.
 * - `c` — Round 4 full-usable cover grandeur at load.
 * - `a` — Round 4 cover (+ optional bleed) scaled by
 *   {@link HERO_VARIANT_A_HEIGHT_SCALE} (~0.8× prior A height).
 * - `a` / `d` / `e` + `bleedUnderTopNav` — usable cover plus the fixed chrome
 *   band so media can start at y=0 under a transparent nav (A then scaled).
 * - `b` — tall ~85% usable for overlay chips.
 * - `d` — ~75% usable mood cover.
 *
 * @param params - Window, chrome, and variant inputs.
 * @returns Integer media height in px (≥ 0).
 */
export function resolveHeroVariantMediaHeight(
  params: ResolveHeroVariantMediaHeightParams
): number {
  if (!params.hasHero) {
    return 0;
  }

  const usable = getHomeUsableHeight({
    windowHeight: params.windowHeight,
    topInset: params.topInset,
    bottomInset: params.bottomInset,
    inFlowHeaderHeight: params.inFlowHeaderHeight,
  });

  const bleedExtra =
    params.bleedUnderTopNav === true
      ? heroBleedUnderTopNavExtraHeight(
          params.topInset,
          params.inFlowHeaderHeight
        )
      : 0;

  if (params.variant === "current" || params.variant === "e") {
    const productionCover = Math.max(
      HERO_VARIANT_MEDIA_MIN,
      Math.round(usable * HERO_VARIANT_CURRENT_USABLE_FRACTION)
    );
    return Math.round(productionCover + bleedExtra);
  }

  if (params.variant === "b") {
    return Math.max(
      HERO_VARIANT_MEDIA_MIN,
      Math.round(usable * HERO_VARIANT_B_USABLE_FRACTION)
    );
  }

  if (params.variant === "d") {
    const moodCover = Math.max(
      HERO_VARIANT_MEDIA_MIN,
      Math.round(usable * HERO_VARIANT_D_USABLE_FRACTION)
    );
    return Math.round(moodCover + bleedExtra);
  }

  // Variants A + C: Round 4 cover at load (commerce chrome = 0).
  const baseCover = Math.max(
    HERO_VARIANT_MEDIA_MIN,
    frame1CoverMediaHeight(usable, 0)
  );

  if (params.variant === "a") {
    const fullBleedCover = baseCover + bleedExtra;
    return Math.max(
      HERO_VARIANT_MEDIA_MIN,
      Math.round(fullBleedCover * HERO_VARIANT_A_HEIGHT_SCALE)
    );
  }

  return baseCover;
}

/**
 * Echo of the Storefront category rail height for sticky / overlay stacks.
 */
export const HERO_VARIANT_CATEGORY_RAIL_HEIGHT =
  STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT;
