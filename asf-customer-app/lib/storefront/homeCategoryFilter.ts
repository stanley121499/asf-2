/**
 * Storefront Home — category-type (`kind_key`) filter helpers (plan §§3.4–3.5).
 *
 * Chips = synthetic **All** + distinct `categories.kind_key` values (not occupations).
 *
 * **Product eligibility (arrivals / See all catalog):**
 * - Base: published, not deleted (same spirit as ProductContext / newest helpers).
 * - Filter `All`: all eligible products **including unassigned**
 *   (`range_id` / `category_id` null and no occupation `product_categories`).
 * - Filter `kind`: must match at least one category with `kind_key = K` via
 *   `products.category_id` **or** `product_categories`. Unassigned → excluded.
 *
 * **Post eligibility (hero / feed):**
 * - `All`: all active posts (caller may still apply feed eligibility).
 * - `kind`: include if `post.category_id` → category with `kind_key = K`, **or**
 *   any **explicit** `post_products` product matches `K`.
 *   Do **not** use department / range / brand taxonomy auto-expand here — that
 *   makes mixed posts match every kind and freezes the hero (plan §3.5 precision).
 *
 * **Promotion eligibility (feed):**
 * - `All`: existing promo eligibility (caller).
 * - `kind`: at least one linked promotion product matches `K`.
 *
 * **Hero pick:** among eligible posts with ≥1 linked product
 * ({@link resolvePostLinkedProductIds}), newest by `coalesce(time_post, created_at)`.
 */

import {
  resolvePostLinkedProductIds,
  resolvePromotionLinkedProductIds,
  type LinkedCatalogProduct,
  type LinkedPostSource,
} from "@/lib/storefront/linkedProducts";
import {
  isNewestEligibleProduct,
  takeNewestProducts,
  type NewestRankableProduct,
} from "@/lib/storefront/newestProducts";
import {
  feedSortAtForPost,
  isFeedEligiblePost,
  parseFeedTimestamp,
  type FeedPostSource,
} from "@/lib/storefront/feedTimeline";

/** Home top-rail filter: All catalog vs one product-type `kind_key`. */
export type HomeKindFilter =
  | { type: "all" }
  | { type: "kind"; kindKey: string };

/** Category fields needed for kind matching. */
export type HomeFilterCategory = {
  id: string;
  kind_key: string | null;
  deleted_at?: string | null;
  name?: string | null;
};

/** Product fields for Home kind filtering + arrivals ranking. */
export type HomeFilterProduct = NewestRankableProduct &
  LinkedCatalogProduct & {
    name?: string;
  };

/** Post fields for Home hero / feed kind filtering. */
export type HomeFilterPost = FeedPostSource &
  LinkedPostSource & {
    /** Explicit `post_products` ids (optional; also on LinkedPostSource). */
    explicitProductIds?: readonly string[];
  };

/** Promotion identity + feed eligibility fields. */
export type HomeFilterPromotion = {
  id: string;
  created_at?: string;
  start_date?: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
};

/**
 * Soft-delete guard for category rows used in kind maps.
 */
function isHomeCategoryActive(category: HomeFilterCategory): boolean {
  if (category.deleted_at !== null && category.deleted_at !== undefined) {
    return category.deleted_at.length === 0;
  }
  return true;
}

/**
 * Builds a `categoryId → category` map for kind lookups.
 *
 * @param categories - Catalog categories (occupation product types)
 */
export function buildCategoriesById(
  categories: readonly HomeFilterCategory[]
): Map<string, HomeFilterCategory> {
  const map = new Map<string, HomeFilterCategory>();
  for (const category of categories) {
    if (!isHomeCategoryActive(category)) {
      continue;
    }
    map.set(category.id, category);
  }
  return map;
}

/**
 * Distinct non-null `kind_key` values from active categories, sorted stably.
 *
 * @param categories - Catalog categories
 */
export function listKindKeys(
  categories: readonly HomeFilterCategory[]
): string[] {
  const keys = new Set<string>();
  for (const category of categories) {
    if (!isHomeCategoryActive(category)) {
      continue;
    }
    const key = category.kind_key;
    if (typeof key === "string" && key.trim().length > 0) {
      keys.add(key.trim());
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

/**
 * Collects category ids attached to a product (`category_id` ∪ junction).
 */
function productCategoryIds(product: HomeFilterProduct): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  if (product.category_id !== null && product.category_id.length > 0) {
    ids.push(product.category_id);
    seen.add(product.category_id);
  }
  const links = product.product_categories;
  if (links === undefined) {
    return ids;
  }
  for (const row of links) {
    const id = row.category_id;
    if (id === null || id.length === 0 || seen.has(id)) {
      continue;
    }
    ids.push(id);
    seen.add(id);
  }
  return ids;
}

/**
 * True when the product matches `kindKey` via primary or junction categories.
 *
 * Unassigned products (no category links) never match a kind chip.
 *
 * @param product - Catalog product
 * @param kindKey - Target `categories.kind_key`
 * @param categoriesById - Active categories keyed by id
 */
export function productMatchesKindKey(
  product: HomeFilterProduct,
  kindKey: string,
  categoriesById: ReadonlyMap<string, HomeFilterCategory>
): boolean {
  const target = kindKey.trim();
  if (target.length === 0) {
    return false;
  }
  for (const categoryId of productCategoryIds(product)) {
    const category = categoriesById.get(categoryId);
    if (category === undefined) {
      continue;
    }
    const key = category.kind_key;
    if (typeof key === "string" && key.trim() === target) {
      return true;
    }
  }
  return false;
}

/**
 * Filters products for Home arrivals / See all under the active kind rail.
 *
 * - `All`: eligible products including unassigned
 * - `kind`: only products matching that `kind_key` (unassigned excluded)
 *
 * @param products - Catalog products
 * @param filter - Active Home kind filter
 * @param categoriesById - Active categories keyed by id
 */
export function filterProductsForHome(
  products: readonly HomeFilterProduct[],
  filter: HomeKindFilter,
  categoriesById: ReadonlyMap<string, HomeFilterCategory>
): HomeFilterProduct[] {
  return products.filter((product) => {
    if (!isNewestEligibleProduct(product)) {
      return false;
    }
    if (filter.type === "all") {
      return true;
    }
    return productMatchesKindKey(product, filter.kindKey, categoriesById);
  });
}

/**
 * True when a post remains relevant under the Home kind filter (plan §3.5).
 *
 * Kind chips use **precise** signals only (`category_id` or explicit
 * `post_products`). Full `resolvePostLinkedProductIds` taxonomy OR
 * (department / range / brand) is intentionally not used — a department-scoped
 * post would otherwise match every kind and keep the hero stuck on All.
 *
 * @param post - Post with optional taxonomy FKs and explicit product ids
 * @param filter - Active Home kind filter
 * @param products - Catalog used for explicit product kind matching
 * @param categoriesById - Active categories keyed by id
 */
export function postMatchesHomeFilter(
  post: HomeFilterPost,
  filter: HomeKindFilter,
  products: readonly HomeFilterProduct[],
  categoriesById: ReadonlyMap<string, HomeFilterCategory>
): boolean {
  if (filter.type === "all") {
    return true;
  }

  const kindKey = filter.kindKey.trim();
  if (kindKey.length === 0) {
    return false;
  }

  if (post.category_id !== null && post.category_id.length > 0) {
    const category = categoriesById.get(post.category_id);
    const key = category?.kind_key;
    if (typeof key === "string" && key.trim() === kindKey) {
      return true;
    }
  }

  const explicitIds = post.explicitProductIds ?? [];
  if (explicitIds.length === 0) {
    return false;
  }

  const productById = new Map<string, HomeFilterProduct>();
  for (const product of products) {
    productById.set(product.id, product);
  }

  for (const productId of explicitIds) {
    if (productId.length === 0) {
      continue;
    }
    const product = productById.get(productId);
    if (product === undefined) {
      continue;
    }
    if (productMatchesKindKey(product, kindKey, categoriesById)) {
      return true;
    }
  }

  return false;
}

/**
 * True when a promotion remains relevant under the Home kind filter (plan §3.5).
 *
 * - `All`: always true (caller applies feed eligibility separately)
 * - `kind`: at least one linked promotion product matches `kindKey`
 *
 * @param promotion - Promotion identity
 * @param filter - Active Home kind filter
 * @param promotionProductRows - `promotion_products` junction rows
 * @param products - Catalog used to validate linked products
 * @param categoriesById - Active categories keyed by id
 */
export function promotionMatchesHomeFilter(
  promotion: HomeFilterPromotion,
  filter: HomeKindFilter,
  promotionProductRows: ReadonlyArray<{
    promotion_id: string;
    product_id: string;
  }>,
  products: readonly HomeFilterProduct[],
  categoriesById: ReadonlyMap<string, HomeFilterCategory>
): boolean {
  if (filter.type === "all") {
    return true;
  }

  const kindKey = filter.kindKey.trim();
  if (kindKey.length === 0) {
    return false;
  }

  const linkedIds = resolvePromotionLinkedProductIds(
    promotion.id,
    promotionProductRows,
    products
  );
  const productById = new Map<string, HomeFilterProduct>();
  for (const product of products) {
    productById.set(product.id, product);
  }

  for (const productId of linkedIds) {
    const product = productById.get(productId);
    if (product === undefined) {
      continue;
    }
    if (productMatchesKindKey(product, kindKey, categoriesById)) {
      return true;
    }
  }

  return false;
}

/**
 * Picks the latest eligible post for the Home hero under the active filter.
 *
 * Ranking: `coalesce(time_post, created_at)` descending (same as feed posts).
 * Skips posts with zero linked products ({@link resolvePostLinkedProductIds}) so
 * the hero never surfaces an empty story; prefers the next matching post with
 * ≥1 link. Returns `null` when none qualify (do **not** fall back to a product).
 *
 * @param posts - Candidate posts
 * @param filter - Active Home kind filter
 * @param products - Catalog for linked-product kind matching
 * @param categoriesById - Active categories keyed by id
 */
export function pickLatestPostForHome(
  posts: readonly HomeFilterPost[],
  filter: HomeKindFilter,
  products: readonly HomeFilterProduct[],
  categoriesById: ReadonlyMap<string, HomeFilterCategory>
): HomeFilterPost | null {
  const eligible = posts.filter((post) => {
    if (!isFeedEligiblePost(post)) {
      return false;
    }
    if (!postMatchesHomeFilter(post, filter, products, categoriesById)) {
      return false;
    }
    return resolvePostLinkedProductIds(post, products).length > 0;
  });

  if (eligible.length === 0) {
    return null;
  }

  const ranked = [...eligible].sort((a, b) => {
    const aAt = feedSortAtForPost(a);
    const bAt = feedSortAtForPost(b);
    const aMs = parseFeedTimestamp(aAt) ?? Number.NEGATIVE_INFINITY;
    const bMs = parseFeedTimestamp(bAt) ?? Number.NEGATIVE_INFINITY;
    if (bMs !== aMs) {
      return bMs - aMs;
    }
    return a.id.localeCompare(b.id);
  });

  return ranked[0] ?? null;
}

/**
 * Takes the newest eligible products for Latest arrivals (default 6 = 2×3).
 *
 * Callers should pass products already filtered via {@link filterProductsForHome}.
 * Does **not** reserve a product hero slot (unlike {@link splitNewestProducts}).
 *
 * @param products - Pre-filtered Home products
 * @param limit - Max cards (default 6)
 */
export function takeLatestArrivalProducts<T extends NewestRankableProduct>(
  products: readonly T[],
  limit: number = 6
): T[] {
  return takeNewestProducts(products, limit);
}

/**
 * Resolves a localized label for a `kind_key` from any category sharing it.
 *
 * Prefers the first active category (by id localeCompare) with that key.
 * Returns `null` when no category carries the key (UI may fall back to i18n).
 *
 * @param kindKey - Target kind slug
 * @param categories - Catalog categories
 */
export function resolveKindLabelFromCategories(
  kindKey: string,
  categories: readonly HomeFilterCategory[]
): string | null {
  const target = kindKey.trim();
  if (target.length === 0) {
    return null;
  }
  const matches = categories
    .filter((category) => {
      if (!isHomeCategoryActive(category)) {
        return false;
      }
      const key = category.kind_key;
      return typeof key === "string" && key.trim() === target;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const first = matches[0];
  if (first === undefined) {
    return null;
  }
  const name = first.name;
  if (typeof name === "string" && name.trim().length > 0) {
    return name;
  }
  return null;
}
