/**
 * Storefront post / promotion → linked product resolution (plan §4.3).
 *
 * **Posts:** taxonomy auto-link ∪ explicit `post_products` (OR across set dimensions).
 * **Promotions:** `promotion_products` only this phase.
 */

/** Product fields used by taxonomy matching. */
export type LinkedCatalogProduct = {
  id: string;
  department_id: string | null;
  range_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  product_categories?: ReadonlyArray<{ category_id: string | null }>;
};

/** Post taxonomy FKs + optional explicit M2M product ids. */
export type LinkedPostSource = {
  id: string;
  department_id: string | null;
  range_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  /** Explicit junction product ids for this post (`post_products`). */
  explicitProductIds?: readonly string[];
};

/** Promotion identity for link resolution. */
export type LinkedPromotionSource = {
  id: string;
};

/**
 * Returns true when a catalog product is eligible for linked lists / feed tiles.
 */
export function isLinkedEligibleProduct(
  product: LinkedCatalogProduct
): boolean {
  if (product.deleted_at !== null && product.deleted_at !== undefined) {
    if (product.deleted_at.length > 0) {
      return false;
    }
  }
  if (product.active === false) {
    return false;
  }
  return true;
}

/**
 * True when the product belongs to the given category via FK **or** `product_categories`.
 */
export function productMatchesCategory(
  product: LinkedCatalogProduct,
  categoryId: string
): boolean {
  if (product.category_id === categoryId) {
    return true;
  }
  const links = product.product_categories;
  if (links === undefined) {
    return false;
  }
  return links.some((row) => row.category_id === categoryId);
}

/**
 * Resolves distinct product ids linked to a post (taxonomy ∪ M2M).
 *
 * Union semantics: each set taxonomy FK contributes matching products independently (OR).
 *
 * @param post - Post with optional taxonomy FKs and `explicitProductIds`
 * @param products - Full (or filtered) catalog to scan
 * @returns Deduped product ids in catalog encounter order
 */
export function resolvePostLinkedProductIds(
  post: LinkedPostSource,
  products: readonly LinkedCatalogProduct[]
): string[] {
  const explicit = new Set(
    (post.explicitProductIds ?? []).filter((id) => id.length > 0)
  );
  const matched = new Set<string>();

  for (const product of products) {
    if (!isLinkedEligibleProduct(product)) {
      continue;
    }
    if (explicit.has(product.id)) {
      matched.add(product.id);
      continue;
    }
    let hit = false;
    if (
      post.department_id !== null &&
      product.department_id === post.department_id
    ) {
      hit = true;
    }
    if (
      !hit &&
      post.range_id !== null &&
      product.range_id === post.range_id
    ) {
      hit = true;
    }
    if (
      !hit &&
      post.brand_id !== null &&
      product.brand_id === post.brand_id
    ) {
      hit = true;
    }
    if (
      !hit &&
      post.category_id !== null &&
      productMatchesCategory(product, post.category_id)
    ) {
      hit = true;
    }
    if (hit) {
      matched.add(product.id);
    }
  }

  // Preserve catalog order for stable UI; include explicit-only ids at end if missing from catalog.
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    if (matched.has(product.id) && !seen.has(product.id)) {
      ordered.push(product.id);
      seen.add(product.id);
    }
  }
  for (const id of explicit) {
    if (!seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  return ordered;
}

/**
 * Resolves product ids for a promotion via `promotion_products` rows.
 *
 * @param promotionId - Promotion uuid
 * @param promotionProductRows - Junction rows (`promotion_id`, `product_id`)
 * @param products - Optional catalog filter (soft-delete / active); when omitted, all junction ids returned
 */
export function resolvePromotionLinkedProductIds(
  promotionId: string,
  promotionProductRows: ReadonlyArray<{
    promotion_id: string;
    product_id: string;
  }>,
  products?: readonly LinkedCatalogProduct[]
): string[] {
  const fromJunction = promotionProductRows
    .filter((row) => row.promotion_id === promotionId)
    .map((row) => row.product_id);

  if (products === undefined) {
    return [...new Set(fromJunction)];
  }

  const eligible = new Set(
    products.filter(isLinkedEligibleProduct).map((p) => p.id)
  );
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const id of fromJunction) {
    if (!eligible.has(id) || seen.has(id)) {
      continue;
    }
    ordered.push(id);
    seen.add(id);
  }
  return ordered;
}

/**
 * Caps a linked product id list for Home feed tiles (plan: 2×3 → max 6).
 * Linked-products **route** should pass uncapped lists (do not call this there).
 */
export function capLinkedProductIdsForFeed(
  productIds: readonly string[],
  cap: number = 6
): string[] {
  if (cap <= 0) {
    return [];
  }
  return productIds.slice(0, cap);
}

/**
 * True when a post has at least one eligible linked catalog product.
 * Early-exits on the first hit — used by Home feed filtering so tab unfreeze
 * does not pay for full id-list builds across every timeline row.
 *
 * @param post - Post taxonomy + optional explicit product ids
 * @param products - Catalog already mapped to {@link LinkedCatalogProduct}
 */
export function postHasLinkedProduct(
  post: LinkedPostSource,
  products: readonly LinkedCatalogProduct[]
): boolean {
  const explicit = post.explicitProductIds;
  if (explicit !== undefined) {
    for (const id of explicit) {
      if (typeof id !== "string" || id.length === 0) {
        continue;
      }
      for (const product of products) {
        if (product.id === id && isLinkedEligibleProduct(product)) {
          return true;
        }
      }
    }
  }

  const hasDepartment = post.department_id !== null;
  const hasRange = post.range_id !== null;
  const hasBrand = post.brand_id !== null;
  const hasCategory = post.category_id !== null;
  if (!hasDepartment && !hasRange && !hasBrand && !hasCategory) {
    return false;
  }

  for (const product of products) {
    if (!isLinkedEligibleProduct(product)) {
      continue;
    }
    if (
      hasDepartment &&
      product.department_id === post.department_id
    ) {
      return true;
    }
    if (hasRange && product.range_id === post.range_id) {
      return true;
    }
    if (hasBrand && product.brand_id === post.brand_id) {
      return true;
    }
    if (
      hasCategory &&
      post.category_id !== null &&
      productMatchesCategory(product, post.category_id)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * True when a promotion junction lists at least one eligible catalog product.
 * Early-exits on the first hit for Home feed filtering.
 *
 * @param promotionId - Promotion uuid
 * @param promotionProductRows - Junction rows for this (or mixed) promotion set
 * @param eligibleProductIds - Precomputed set of eligible catalog product ids
 */
export function promotionHasLinkedProduct(
  promotionId: string,
  promotionProductRows: ReadonlyArray<{
    promotion_id: string;
    product_id: string;
  }>,
  eligibleProductIds: ReadonlySet<string>
): boolean {
  for (const row of promotionProductRows) {
    if (row.promotion_id !== promotionId) {
      continue;
    }
    if (eligibleProductIds.has(row.product_id)) {
      return true;
    }
  }
  return false;
}

/**
 * Builds the set of catalog product ids eligible for linked lists / feed tiles.
 *
 * @param products - Catalog already mapped to {@link LinkedCatalogProduct}
 */
export function buildEligibleLinkedProductIdSet(
  products: readonly LinkedCatalogProduct[]
): Set<string> {
  const eligibleIds = new Set<string>();
  for (const product of products) {
    if (isLinkedEligibleProduct(product)) {
      eligibleIds.add(product.id);
    }
  }
  return eligibleIds;
}
