import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/database.types";

type ServiceClient = SupabaseClient<Database>;

/** One cart line for server-side eligibility and discount calculation. */
export interface PromotionCartLine {
  product_id: string;
  amount: number;
}

export type ValidatePromotionSuccess = {
  valid: true;
  promotionId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmountMyr: number;
};

export type ValidatePromotionFailure = {
  valid: false;
  reason: string;
};

export type ValidatePromotionResult = ValidatePromotionSuccess | ValidatePromotionFailure;

/**
 * Normalizes promo codes for storage and lookup (trim + lowercase).
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Rounds MYR to two decimal places.
 */
function roundMyr(value: number): number {
  return Math.round(value * 100) / 100;
}

function isDiscountType(value: string): value is "percentage" | "fixed" {
  return value === "percentage" || value === "fixed";
}

/**
 * Validates a promotion against cart lines; loads prices from `products` via service client.
 * Does not increment uses_count.
 */
export async function validatePromotionForCart(
  supabase: ServiceClient,
  rawCode: string,
  cartLines: PromotionCartLine[]
): Promise<ValidatePromotionResult> {
  const code = normalizePromoCode(rawCode);
  if (code.length === 0) {
    return { valid: false, reason: "Promo code is required" };
  }

  if (cartLines.length === 0) {
    return { valid: false, reason: "Cart is empty" };
  }

  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select(
      "id, discount_type, discount_value, active, deleted_at, start_date, end_date, max_uses, uses_count"
    )
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();

  if (promoError !== null) {
    console.error("validatePromotionForCart: promotion query", promoError.message);
    return { valid: false, reason: "Could not validate promo code" };
  }

  if (promotion === null) {
    return { valid: false, reason: "Invalid promo code" };
  }

  if (promotion.deleted_at !== null) {
    return { valid: false, reason: "This promotion is no longer available" };
  }

  if (!promotion.active) {
    return { valid: false, reason: "This promotion is inactive" };
  }

  const now = new Date();
  if (promotion.start_date !== null && promotion.start_date.length > 0) {
    const start = new Date(promotion.start_date);
    if (now < start) {
      return { valid: false, reason: "This promotion has not started yet" };
    }
  }
  if (promotion.end_date !== null && promotion.end_date.length > 0) {
    const end = new Date(promotion.end_date);
    if (now > end) {
      return { valid: false, reason: "This promotion has expired" };
    }
  }

  if (
    promotion.max_uses !== null &&
    promotion.uses_count >= promotion.max_uses
  ) {
    return { valid: false, reason: "This promo code has reached its usage limit" };
  }

  if (!isDiscountType(promotion.discount_type)) {
    return { valid: false, reason: "Invalid promotion configuration" };
  }

  const discountValueRaw = promotion.discount_value;
  const discountValue =
    typeof discountValueRaw === "number"
      ? discountValueRaw
      : Number(discountValueRaw);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { valid: false, reason: "Invalid promotion configuration" };
  }

  const { data: scopeRows, error: scopeError } = await supabase
    .from("promotion_products")
    .select("product_id")
    .eq("promotion_id", promotion.id);

  if (scopeError !== null) {
    console.error("validatePromotionForCart: scope query", scopeError.message);
    return { valid: false, reason: "Could not validate promo code" };
  }

  const scopedIds = new Set(
    (scopeRows ?? []).map((row) => row.product_id).filter((id) => id.length > 0)
  );

  const productIds = Array.from(
    new Set(cartLines.map((line) => line.product_id).filter((id) => id.length > 0))
  );

  const { data: priceRows, error: priceError } = await supabase
    .from("products")
    .select("id, price")
    .in("id", productIds);

  if (priceError !== null) {
    console.error("validatePromotionForCart: prices query", priceError.message);
    return { valid: false, reason: "Could not load product prices" };
  }

  const priceById = new Map<string, number>();
  for (const row of priceRows ?? []) {
    const p = row.price;
    const num = typeof p === "number" ? p : Number(p);
    if (Number.isFinite(num)) {
      priceById.set(row.id, num);
    }
  }

  let eligibleSubtotalMyr = 0;
  for (const line of cartLines) {
    const amt = line.amount;
    if (!Number.isFinite(amt) || amt <= 0) {
      continue;
    }
    const unit = priceById.get(line.product_id);
    if (unit === undefined || !Number.isFinite(unit)) {
      return { valid: false, reason: "Product price missing for cart line" };
    }
    if (scopedIds.size === 0 || scopedIds.has(line.product_id)) {
      eligibleSubtotalMyr += unit * amt;
    }
  }

  if (eligibleSubtotalMyr <= 0) {
    return {
      valid: false,
      reason: "This promo does not apply to items in your cart",
    };
  }

  let discountAmountMyr: number;
  if (promotion.discount_type === "percentage") {
    if (discountValue > 100) {
      return { valid: false, reason: "Invalid promotion configuration" };
    }
    discountAmountMyr = eligibleSubtotalMyr * (discountValue / 100);
  } else {
    discountAmountMyr = discountValue;
  }

  discountAmountMyr = roundMyr(Math.min(discountAmountMyr, eligibleSubtotalMyr));
  if (discountAmountMyr <= 0) {
    return { valid: false, reason: "No discount applicable" };
  }

  return {
    valid: true,
    promotionId: promotion.id,
    discountType: promotion.discount_type,
    discountValue,
    discountAmountMyr,
  };
}
