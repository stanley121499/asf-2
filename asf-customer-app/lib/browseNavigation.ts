import type { Href, Router } from "expo-router";

/**
 * Where the product detail back control should return.
 * - `home` — opened from the Home tab (new arrivals, etc.)
 * - `catalog` — opened from the Shop catalog list
 * - `wishlist` — opened from the wishlist screen
 */
export type BrowseProductReturnTo = "home" | "catalog" | "wishlist";

/**
 * Type guard for `BrowseProductReturnTo` route params.
 */
function isBrowseProductReturnTo(value: string): value is BrowseProductReturnTo {
  return value === "home" || value === "catalog" || value === "wishlist";
}

/**
 * Normalizes a route search param to a known `BrowseProductReturnTo`.
 *
 * @param value - Raw Expo Router param (`string`, `string[]`, or missing).
 * @returns A valid return target; defaults to `catalog` when absent or unknown.
 */
export function resolveBrowseReturnTo(
  value: string | string[] | undefined
): BrowseProductReturnTo {
  const raw = typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
  if (typeof raw === "string" && isBrowseProductReturnTo(raw)) {
    return raw;
  }
  return "catalog";
}

export interface OpenBrowseProductOptions {
  /** Screen to restore when the user taps back on the PDP. Defaults to `catalog`. */
  returnTo?: BrowseProductReturnTo;
}

/**
 * Opens product detail inside the Shop (browse) tab without stacking leftover PDPs.
 *
 * Uses `navigate` so an existing `[productId]` screen is reused (params updated)
 * instead of pushing another copy. `withAnchor` keeps `browse/index` under the PDP
 * so the Shop tab has a catalog to land on; callers must pass `returnTo` so the PDP
 * back control can restore Home / Wishlist instead of always popping to catalog.
 */
export function openBrowseProduct(
  router: Router,
  productId: string,
  options?: OpenBrowseProductOptions
): void {
  const trimmed = productId.trim();
  if (trimmed.length === 0) {
    return;
  }

  const returnTo: BrowseProductReturnTo = options?.returnTo ?? "catalog";

  router.navigate(
    {
      pathname: "/(tabs)/browse/[productId]",
      params: { productId: trimmed, returnTo },
    },
    { withAnchor: true }
  );
}

/**
 * Focuses the Shop tab on the catalog list, clearing any leftover product detail.
 */
export function openBrowseCatalog(router: Router): void {
  router.navigate("/(tabs)/browse" as Href);
}

/**
 * Navigates away from a PDP according to the entry-point `returnTo` param.
 */
export function leaveBrowseProduct(router: Router, returnTo: BrowseProductReturnTo): void {
  if (returnTo === "home") {
    router.navigate("/(tabs)/" as Href);
    return;
  }
  if (returnTo === "wishlist") {
    router.navigate("/wishlist" as Href);
    return;
  }
  openBrowseCatalog(router);
}
