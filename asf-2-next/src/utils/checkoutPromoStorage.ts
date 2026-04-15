/**
 * Persists applied promo metadata from the cart across navigation to checkout (sessionStorage).
 */

export const CHECKOUT_PROMO_STORAGE_KEY = "asf_checkout_promo_v1";

export type CheckoutPromoPayload = {
  promoCode: string;
  promotionId: string;
  discountAmountMyr: number;
};

/**
 * Writes promo payload for the checkout flow.
 */
export function writeCheckoutPromo(payload: CheckoutPromoPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(
      CHECKOUT_PROMO_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Reads stored promo payload, or null if missing / invalid.
 */
export function readCheckoutPromo(): CheckoutPromoPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_PROMO_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const o = parsed as Record<string, unknown>;
    const promoCode = o["promoCode"];
    const promotionId = o["promotionId"];
    const discountAmountMyr = o["discountAmountMyr"];
    if (
      typeof promoCode !== "string" ||
      typeof promotionId !== "string" ||
      typeof discountAmountMyr !== "number" ||
      !Number.isFinite(discountAmountMyr)
    ) {
      return null;
    }
    return { promoCode, promotionId, discountAmountMyr };
  } catch {
    return null;
  }
}

/**
 * Clears stored promo after order completion or when user removes the code.
 */
export function clearCheckoutPromo(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(CHECKOUT_PROMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
