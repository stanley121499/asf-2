/**
 * Resolves a category-mood hero image URI for Design Lab variant D.
 *
 * Preference order when a kind chip is selected:
 * 1. First category with matching `kind_key` that has a non-empty `media_url`
 * 2. First filtered product with a primary media URL
 * 3. Fallback cover URI (current post hero)
 *
 * When filter is All, returns the fallback cover unchanged.
 */

import type { Category } from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import type { HomeKindFilter } from "@/lib/storefront/homeCategoryFilter";
import { resolveProductPrimaryMediaUrl } from "@/lib/storefront/productColorMedia";

/**
 * Inputs for {@link resolveCategoryMoodUri}.
 */
export type ResolveCategoryMoodUriParams = {
  /** Active Home kind filter. */
  kindFilter: HomeKindFilter;
  /** Active catalog categories (for `kind_key` + `media_url`). */
  categories: readonly Category[];
  /** Products already filtered to the active kind (Home≠Shop capped OK). */
  filteredProducts: readonly Product[];
  /** Current post-hero cover URI (may be empty). */
  fallbackCoverUri: string;
};

/**
 * Picks the mood image URI for variant D, or the fallback cover.
 *
 * @param params - Filter, categories, products, and fallback cover.
 * @returns HTTPS/relative media URL, or empty string when nothing usable.
 */
export function resolveCategoryMoodUri(
  params: ResolveCategoryMoodUriParams
): string {
  const fallback =
    typeof params.fallbackCoverUri === "string"
      ? params.fallbackCoverUri.trim()
      : "";

  if (params.kindFilter.type === "all") {
    return fallback;
  }

  const targetKind = params.kindFilter.kindKey.trim();
  if (targetKind.length === 0) {
    return fallback;
  }

  const matchingCategories = params.categories
    .filter((category) => {
      const key = category.kind_key;
      return typeof key === "string" && key.trim() === targetKind;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const category of matchingCategories) {
    const media =
      typeof category.media_url === "string" ? category.media_url.trim() : "";
    if (media.length > 0) {
      return media;
    }
  }

  for (const product of params.filteredProducts) {
    const uri = resolveProductPrimaryMediaUrl(product);
    if (uri !== null && uri.trim().length > 0) {
      return uri.trim();
    }
  }

  return fallback;
}

/**
 * Caps the product peek row under the mood hero (keep Home performant).
 */
export const CATEGORY_PRODUCT_PEEK_CAP = 4;
