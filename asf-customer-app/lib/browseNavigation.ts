import type { Href, ImperativeRouter } from "expo-router";

/**
 * Where the product detail back control should return.
 * - `home` — opened from the Home tab (new arrivals, etc.)
 * - `catalog` — opened from the Shop catalog list
 * - `wishlist` — opened from the wishlist screen
 */
export type BrowseProductReturnTo = "home" | "catalog" | "wishlist";

/**
 * One-shot color preselect intent for Storefront PDP (plan §3.4 / §5.3).
 * Cleared after {@link consumeBrowseProductColorId} so a later open without
 * `colorId` cannot inherit a stale swatch.
 */
type BrowseColorIntent = {
  productId: string;
  colorId: string;
};

let pendingBrowseColorIntent: BrowseColorIntent | null = null;

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

/**
 * Normalizes a route search param to a color uuid string, or `null`.
 *
 * @param value - Raw Expo Router `colorId` param.
 */
export function resolveBrowseColorId(
  value: string | string[] | undefined
): string | null {
  const raw = typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface OpenBrowseProductOptions {
  /** Screen to restore when the user taps back on the PDP. Defaults to `catalog`. */
  returnTo?: BrowseProductReturnTo;
  /**
   * Optional active `product_colors.id` to preselect on Storefront PDP.
   * Persisted as a one-shot intent and passed as a route param; PDP should
   * call {@link consumeBrowseProductColorId} after applying.
   */
  colorId?: string;
}

/**
 * Stores (or clears) the one-shot color intent used by Storefront PDP.
 *
 * @param productId - Target product uuid
 * @param colorId - Active color uuid, or `null` to clear any prior intent
 */
function setBrowseColorIntent(productId: string, colorId: string | null): void {
  if (colorId === null) {
    pendingBrowseColorIntent = null;
    return;
  }
  pendingBrowseColorIntent = { productId, colorId };
}

/**
 * Returns and clears a pending color preselect for `productId`.
 * Call once when the Storefront PDP applies the initial color so later
 * navigations cannot reuse a stale swatch.
 *
 * @param productId - Product currently shown on the PDP
 * @returns Color uuid when intent matches this product; otherwise `null`
 */
export function consumeBrowseProductColorId(productId: string): string | null {
  const trimmed = productId.trim();
  if (trimmed.length === 0 || pendingBrowseColorIntent === null) {
    return null;
  }
  if (pendingBrowseColorIntent.productId !== trimmed) {
    return null;
  }
  const colorId = pendingBrowseColorIntent.colorId;
  pendingBrowseColorIntent = null;
  return colorId;
}

/**
 * Peeks at the pending color intent without clearing it (tests / diagnostics).
 *
 * @returns Current intent, or `null`
 */
export function peekBrowseProductColorIntent(): BrowseColorIntent | null {
  return pendingBrowseColorIntent;
}

/**
 * Opens product detail inside the Shop (browse) tab without stacking leftover PDPs.
 *
 * Uses `navigate` so an existing `[productId]` screen is reused (params updated)
 * instead of pushing another copy. `withAnchor` keeps `browse/index` under the PDP
 * so the Shop tab has a catalog to land on; callers must pass `returnTo` so the PDP
 * back control can restore Home / Wishlist instead of always popping to catalog.
 *
 * When `options.colorId` is set, Storefront PDP should select that active color
 * and show its medias (plan R6). Intent is cleared via
 * {@link consumeBrowseProductColorId} after consume.
 */
export function openBrowseProduct(
  router: ImperativeRouter,
  productId: string,
  options?: OpenBrowseProductOptions
): void {
  const trimmed = productId.trim();
  if (trimmed.length === 0) {
    return;
  }

  const returnTo: BrowseProductReturnTo = options?.returnTo ?? "catalog";
  const colorRaw = options?.colorId;
  const colorId =
    typeof colorRaw === "string" && colorRaw.trim().length > 0
      ? colorRaw.trim()
      : null;

  setBrowseColorIntent(trimmed, colorId);

  // Always pass `colorId` so a prior navigate cannot leave a stale swatch param
  // on the reused `[productId]` screen (`""` → resolveBrowseColorId → null).
  router.navigate(
    {
      pathname: "/(tabs)/browse/[productId]",
      params: {
        productId: trimmed,
        returnTo,
        colorId: colorId ?? "",
      },
    },
    { withAnchor: true }
  );
}

/**
 * Focuses the Shop tab on the catalog list, clearing any leftover product detail.
 */
export function openBrowseCatalog(router: ImperativeRouter): void {
  router.navigate("/(tabs)/browse" as Href);
}

/** Entity kind for the Storefront linked-products list route (plan §3.3). */
export type LinkedProductsKind = "post" | "promotion";

/**
 * Type guard for linked-products `kind` query params.
 */
export function isLinkedProductsKind(value: string): value is LinkedProductsKind {
  return value === "post" || value === "promotion";
}

/**
 * Normalizes a route search param to {@link LinkedProductsKind}, or `null`.
 *
 * @param value - Raw Expo Router `kind` param
 */
export function resolveLinkedProductsKind(
  value: string | string[] | undefined
): LinkedProductsKind | null {
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim().toLowerCase();
  return isLinkedProductsKind(trimmed) ? trimmed : null;
}

/**
 * Normalizes a route search param to a non-empty entity uuid, or `null`.
 *
 * @param value - Raw Expo Router `id` param
 */
export function resolveLinkedProductsId(
  value: string | string[] | undefined
): string | null {
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Opens the uncapped linked-products list for a post or promotion (plan R12).
 *
 * Path: `/(tabs)/browse/linked-products?kind=post|promotion&id=<uuid>`
 */
export function openLinkedProducts(
  router: ImperativeRouter,
  kind: LinkedProductsKind,
  entityId: string
): void {
  const trimmed = entityId.trim();
  if (trimmed.length === 0) {
    return;
  }
  router.push({
    pathname: "/(tabs)/browse/linked-products",
    params: {
      kind,
      id: trimmed,
    },
  });
}

/** Scope for Home arrivals / catalog **See all** product list (plan §3.6). */
export type BrowseProductListScope = "all" | "kind";

/**
 * Options for {@link openBrowseProductList}.
 *
 * - `scope: "all"` — entire eligible catalog (includes unassigned)
 * - `scope: "kind"` — requires non-empty `kindKey` (`categories.kind_key`)
 */
export type OpenBrowseProductListOptions = {
  scope: BrowseProductListScope;
  /** Required when `scope` is `"kind"` (e.g. `"shoes"`). */
  kindKey?: string;
};

/**
 * Type guard for product-list `scope` query params.
 */
export function isBrowseProductListScope(
  value: string
): value is BrowseProductListScope {
  return value === "all" || value === "kind";
}

/**
 * Normalizes a route search param to {@link BrowseProductListScope}, or `null`.
 *
 * @param value - Raw Expo Router `scope` param
 */
export function resolveBrowseProductListScope(
  value: string | string[] | undefined
): BrowseProductListScope | null {
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim().toLowerCase();
  return isBrowseProductListScope(trimmed) ? trimmed : null;
}

/**
 * Normalizes a route search param to a non-empty `kindKey`, or `null`.
 *
 * @param value - Raw Expo Router `kindKey` param
 */
export function resolveBrowseProductListKindKey(
  value: string | string[] | undefined
): string | null {
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Opens the uncapped Home **See all** product list (plan §3.6).
 *
 * Path: `/(tabs)/browse/product-list?scope=all|kind&kindKey=<slug>`
 *
 * Post/promo **See all** continues to use {@link openLinkedProducts}.
 *
 * @param router - Expo Router instance
 * @param options - `scope` plus `kindKey` when scoped to a product type
 */
export function openBrowseProductList(
  router: ImperativeRouter,
  options: OpenBrowseProductListOptions
): void {
  if (options.scope === "kind") {
    const kindRaw = options.kindKey;
    const kindKey =
      typeof kindRaw === "string" && kindRaw.trim().length > 0
        ? kindRaw.trim()
        : null;
    if (kindKey === null) {
      return;
    }
    router.push({
      pathname: "/(tabs)/browse/product-list",
      params: {
        scope: "kind",
        kindKey,
      },
    });
    return;
  }

  router.push({
    pathname: "/(tabs)/browse/product-list",
    params: {
      scope: "all",
    },
  });
}

/**
 * Navigates away from a PDP according to the entry-point `returnTo` param.
 */
export function leaveBrowseProduct(router: ImperativeRouter, returnTo: BrowseProductReturnTo): void {
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
