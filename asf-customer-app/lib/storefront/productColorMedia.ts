/**
 * Storefront colorway media resolver (plan §3.1 / §5.1).
 *
 * Prefer medias tagged with the selected `color_id` (lowest `arrangement` first),
 * else fall back to product-level medias (`color_id` null), else any media.
 */

/** Minimal media row for colorway resolution. */
export type ColorMediaRow = {
  id: string;
  media_url: string;
  color_id: string | null;
  arrangement: number;
  product_id: string;
};

/**
 * Product-shaped input accepted by Storefront media helpers.
 * Compatible with {@link Product} from ProductContext (`medias` client field).
 */
export type ProductColorMediaSource = {
  id: string;
  medias: ReadonlyArray<{
    id: string;
    media_url: string;
    color_id: string | null;
    arrangement: number | null;
    product_id: string;
  }>;
};

/**
 * Maps ProductContext medias into {@link ColorMediaRow} (null arrangement → 0).
 *
 * @param product - Product with nested `medias` from ProductContext
 */
export function mediasFromProduct(
  product: ProductColorMediaSource
): ColorMediaRow[] {
  return product.medias.map((m) => ({
    id: m.id,
    media_url: m.media_url,
    color_id: m.color_id,
    arrangement: typeof m.arrangement === "number" ? m.arrangement : 0,
    product_id: m.product_id,
  }));
}

/**
 * Sorts medias by ascending `arrangement`, then stable `id`.
 */
export function sortMediasByArrangement<T extends ColorMediaRow>(
  medias: readonly T[]
): T[] {
  return [...medias].sort((a, b) => {
    if (a.arrangement !== b.arrangement) {
      return a.arrangement - b.arrangement;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Resolves gallery medias for a product + optional color (Storefront PDP / tiles).
 *
 * Order of preference:
 * 1. Medias tagged with `colorId` (when provided)
 * 2. Product-level medias (`color_id` null)
 * 3. All medias for the product
 *
 * @param medias - Product medias (may include other products; filtered by `productId`)
 * @param productId - Product whose medias to consider
 * @param colorId - Active colorway id, or `null` / `undefined` for default
 */
export function resolveProductColorMedias(
  medias: readonly ColorMediaRow[],
  productId: string,
  colorId?: string | null
): ColorMediaRow[] {
  const forProduct = sortMediasByArrangement(
    medias.filter((m) => m.product_id === productId)
  );
  if (forProduct.length === 0) {
    return [];
  }

  if (typeof colorId === "string" && colorId.length > 0) {
    const colorMatch = forProduct.filter((m) => m.color_id === colorId);
    if (colorMatch.length > 0) {
      return colorMatch;
    }
  }

  const productLevel = forProduct.filter((m) => m.color_id === null);
  if (productLevel.length > 0) {
    return productLevel;
  }

  return forProduct;
}

/**
 * Resolves the primary display image URL for a product + optional color.
 *
 * @param medias - Product medias (may include other products; filtered by `productId`)
 * @param productId - Product whose medias to consider
 * @param colorId - Active colorway id, or `null` / `undefined` for product-level default
 * @returns HTTPS/relative `media_url`, or `null` when no media exists
 */
export function resolveProductColorMediaUrl(
  medias: readonly ColorMediaRow[],
  productId: string,
  colorId?: string | null
): string | null {
  const gallery = resolveProductColorMedias(medias, productId, colorId);
  const first = gallery[0];
  if (first === undefined || first.media_url.length === 0) {
    return null;
  }
  return first.media_url;
}

/**
 * Convenience: primary media URL from a ProductContext product + optional color.
 *
 * @param product - Product with `medias` from context
 * @param colorId - Active colorway id, or `null` / `undefined`
 */
export function resolveProductPrimaryMediaUrl(
  product: ProductColorMediaSource,
  colorId?: string | null
): string | null {
  return resolveProductColorMediaUrl(
    mediasFromProduct(product),
    product.id,
    colorId
  );
}

/**
 * Convenience: gallery medias from a ProductContext product + optional color.
 *
 * @param product - Product with `medias` from context
 * @param colorId - Active colorway id, or `null` / `undefined`
 */
export function resolveProductGalleryMedias(
  product: ProductColorMediaSource,
  colorId?: string | null
): ColorMediaRow[] {
  return resolveProductColorMedias(
    mediasFromProduct(product),
    product.id,
    colorId
  );
}

/**
 * True when a color string looks like a CSS hex (`#RGB` / `#RRGGBB`).
 *
 * @param value - `product_colors.color` text (hex or name)
 */
export function isCssHexColor(value: string): boolean {
  const trimmed = value.trim();
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed);
}
