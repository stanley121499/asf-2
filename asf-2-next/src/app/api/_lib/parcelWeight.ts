/**
 * Parcel weight estimation for Delyva instantQuote and checkout.
 *
 * TODO(weight): replace with per-product `products.weight` (option A) once the
 * column, admin UI, and migration exist. Until then we assume a fixed weight
 * per cart line quantity.
 */

/** Default kilograms assumed for each unit in the cart (quantity multiplier). */
export const DEFAULT_ITEM_WEIGHT_KG = 0.5;

/** Minimum parcel weight sent to Delyva (avoids zero-weight quote failures). */
export const MIN_PARCEL_WEIGHT_KG = 0.1;

/**
 * Minimal cart row shape needed to compute total parcel weight.
 */
export interface CartWeightLine {
  amount: number;
}

/**
 * Sums cart line quantities and multiplies by {@link DEFAULT_ITEM_WEIGHT_KG}.
 * Result is clamped to at least {@link MIN_PARCEL_WEIGHT_KG}.
 */
export function computeCartWeightKg(rows: CartWeightLine[]): number {
  let totalUnits = 0;
  for (const row of rows) {
    if (typeof row.amount === "number" && Number.isFinite(row.amount) && row.amount > 0) {
      totalUnits += row.amount;
    }
  }
  const rawKg = totalUnits * DEFAULT_ITEM_WEIGHT_KG;
  if (rawKg <= 0) {
    return MIN_PARCEL_WEIGHT_KG;
  }
  return Math.max(rawKg, MIN_PARCEL_WEIGHT_KG);
}

/**
 * Returns a Delyva-compatible weight object from cart rows.
 */
export function cartWeightPayload(rows: CartWeightLine[]): { unit: "kg"; value: number } {
  return { unit: "kg", value: computeCartWeightKg(rows) };
}
