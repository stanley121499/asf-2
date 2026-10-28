/**
 * Storefront Home — newest-products ranking helpers.
 *
 * Ranking: active catalog products sorted by `created_at` descending (newest first).
 *
 * **Occupation Home (2026-09-03):** prefer {@link takeNewestProducts} / Home
 * `takeLatestArrivalProducts` for a plain top-N grid (no product hero). Hero is
 * a post via `pickLatestPostForHome` — do not use {@link splitNewestProducts}
 * for the new Storefront Home.
 *
 * {@link splitNewestProducts} remains for transitional / legacy callers:
 * - **hero** = rank 1 (newest)
 * - **grid** = ranks 2…7 (exactly up to six cards; hero id never duplicated)
 */

/** Minimal product shape needed for newest ranking. */
export type NewestRankableProduct = {
  id: string;
  created_at: string;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
};

/**
 * Result of splitting a newest-sorted catalog into Home hero + 2×3 grid.
 */
export type NewestProductsSplit<T extends NewestRankableProduct> = {
  /** Newest product, or `null` when the catalog is empty after filters. */
  hero: T | null;
  /** Products ranked 2nd–7th newest (length 0–6). */
  grid: T[];
};

/**
 * Returns true when a product should appear in Storefront newest ranking.
 * Soft-deleted rows are excluded; inactive / non-published statuses when present.
 */
export function isNewestEligibleProduct(
  product: NewestRankableProduct
): boolean {
  if (product.deleted_at !== null && product.deleted_at !== undefined) {
    if (product.deleted_at.length > 0) {
      return false;
    }
  }
  if (product.active === false) {
    return false;
  }
  if (typeof product.status === "string" && product.status.length > 0) {
    const normalized = product.status.toLowerCase();
    if (normalized === "draft" || normalized === "archived" || normalized === "inactive") {
      return false;
    }
  }
  return true;
}

/**
 * Sorts products newest-first by `created_at` (ISO timestamps).
 * Invalid dates sort last.
 */
export function sortProductsNewestFirst<T extends NewestRankableProduct>(
  products: readonly T[]
): T[] {
  return [...products].sort((a, b) => {
    const aMs = Date.parse(a.created_at);
    const bMs = Date.parse(b.created_at);
    const aSafe = Number.isNaN(aMs) ? Number.NEGATIVE_INFINITY : aMs;
    const bSafe = Number.isNaN(bMs) ? Number.NEGATIVE_INFINITY : bMs;
    if (bSafe !== aSafe) {
      return bSafe - aSafe;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Takes the newest eligible products by `created_at` (no hero split).
 *
 * Use for Storefront Latest arrivals under the kind filter (plan §3.4 C).
 *
 * @param products - Catalog products (any subset; filtered + sorted inside)
 * @param limit - Max items to return (default 6 for a 2×3 grid)
 */
export function takeNewestProducts<T extends NewestRankableProduct>(
  products: readonly T[],
  limit: number = 6
): T[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  if (safeLimit === 0) {
    return [];
  }
  const ranked = sortProductsNewestFirst(
    products.filter(isNewestEligibleProduct)
  );
  return ranked.slice(0, safeLimit);
}

/**
 * Splits eligible products into Home hero (newest) and grid (2nd–7th).
 *
 * @deprecated For occupation Storefront Home, use {@link takeNewestProducts}
 * (arrivals) + post hero — do not split a product hero.
 *
 * @param products - Catalog products (any subset; filtered + sorted inside)
 * @returns `{ hero, grid }` where `hero` is excluded from `grid`
 */
export function splitNewestProducts<T extends NewestRankableProduct>(
  products: readonly T[]
): NewestProductsSplit<T> {
  const ranked = sortProductsNewestFirst(
    products.filter(isNewestEligibleProduct)
  );
  if (ranked.length === 0) {
    return { hero: null, grid: [] };
  }
  const hero = ranked[0] ?? null;
  const grid = ranked.slice(1, 7);
  return { hero, grid };
}
