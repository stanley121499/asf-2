/** Minimal `product_stock` fields needed for variant-aware inventory resolution. */
export type ProductStockVariantRow = {
  id: string;
  product_id: string;
  color_id: string | null;
  size_id: string | null;
  count: number;
};

export type ResolveProductStockParams = {
  productId: string;
  productStocks: readonly ProductStockVariantRow[];
  requiresColor: boolean;
  requiresSize: boolean;
  selectedColorId: string | null;
  selectedSizeId: string | null;
};

/**
 * Normalizes optional foreign keys so null and undefined compare consistently.
 */
function normalizeNullableId(value: string | null | undefined): string | null {
  return value ?? null;
}

/**
 * Sums stock counts across all variant rows for product listing aggregates.
 */
export function sumProductStockCounts(
  rows: readonly Pick<ProductStockVariantRow, "count">[]
): number {
  return rows.reduce(
    (sum, row) => sum + (typeof row.count === "number" ? row.count : 0),
    0
  );
}

/**
 * Returns true when at least one row tracks a specific color or size variant.
 */
export function hasVariantSpecificStockRows(
  rows: readonly ProductStockVariantRow[]
): boolean {
  return rows.some((row) => row.color_id !== null || row.size_id !== null);
}

/**
 * Resolves the applicable stock row for the user's current variant selection.
 *
 * Resolution order:
 * 1. Exact match on `(color_id, size_id)` for the selected variant.
 * 2. Legacy shared pool: when the product has variants but inventory was stored
 *    only as a single `(null, null)` row, use that row so seeded stock still works.
 */
export function resolveProductStockRow(
  params: ResolveProductStockParams
): ProductStockVariantRow | null {
  const {
    productId,
    productStocks,
    requiresColor,
    requiresSize,
    selectedColorId,
    selectedSizeId,
  } = params;

  if (requiresColor && selectedColorId === null) {
    return null;
  }
  if (requiresSize && selectedSizeId === null) {
    return null;
  }

  const wantedColorId = requiresColor ? selectedColorId : null;
  const wantedSizeId = requiresSize ? selectedSizeId : null;

  const stocksForProduct = productStocks.filter((row) => row.product_id === productId);

  const exactMatch = stocksForProduct.find(
    (row) =>
      normalizeNullableId(row.color_id) === wantedColorId &&
      normalizeNullableId(row.size_id) === wantedSizeId
  );
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  const hasVariants = requiresColor || requiresSize;
  if (hasVariants && !hasVariantSpecificStockRows(stocksForProduct)) {
    const sharedPool = stocksForProduct.find(
      (row) => row.color_id === null && row.size_id === null
    );
    if (sharedPool !== undefined) {
      return sharedPool;
    }
  }

  return null;
}

/**
 * Reads a safe numeric quantity from a resolved stock row.
 */
export function getProductStockQuantity(row: ProductStockVariantRow | null): number {
  if (row === null) {
    return 0;
  }
  return typeof row.count === "number" ? row.count : 0;
}
