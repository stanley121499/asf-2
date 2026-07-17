/**
 * Persists applied warranty credit metadata from cart across navigation to checkout.
 */

export const CHECKOUT_WARRANTY_CREDIT_STORAGE_KEY = "asf_checkout_warranty_credit_v1";

export type CheckoutWarrantyCreditPayload = {
  creditId: string;
  discountAmountMyr: number;
};

/**
 * Writes warranty credit payload for the checkout flow.
 */
export function writeCheckoutWarrantyCredit(payload: CheckoutWarrantyCreditPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(
      CHECKOUT_WARRANTY_CREDIT_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Reads stored warranty credit payload, or null if missing / invalid.
 */
export function readCheckoutWarrantyCredit(): CheckoutWarrantyCreditPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_WARRANTY_CREDIT_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const o = parsed as Record<string, unknown>;
    const creditId = o["creditId"];
    const discountAmountMyr = o["discountAmountMyr"];
    if (
      typeof creditId !== "string" ||
      typeof discountAmountMyr !== "number" ||
      !Number.isFinite(discountAmountMyr)
    ) {
      return null;
    }
    return { creditId, discountAmountMyr };
  } catch {
    return null;
  }
}

/**
 * Clears stored warranty credit after order completion or when user removes it.
 */
export function clearCheckoutWarrantyCredit(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(CHECKOUT_WARRANTY_CREDIT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
