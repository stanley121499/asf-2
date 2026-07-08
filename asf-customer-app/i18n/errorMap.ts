/**
 * Raw auth / network error message → translation key.
 * Unknown messages fall back to `errors.networkError`.
 */
const ERROR_KEY_MAP: Record<string, string> = {
  "Invalid login credentials": "errors.invalidCredentials",
  "Failed to fetch products": "errors.fetchProductsFailed",
  "Please sign in to use the wishlist.": "wishlist.signInRequired",
  "Invalid product id.": "errors.invalidProductId",
  "Already in your wishlist.": "wishlist.alreadyIn",
  "Added to wishlist.": "wishlist.added",
  "Removed from wishlist.": "wishlist.removed",
  "Invalid product or user id.": "cart.errors.invalidProductOrUser",
  "Amount must be at least 1.": "cart.errors.amountMin",
  "Missing cart id for update.": "cart.errors.missingCartId",
  "Invalid cart id for delete.": "cart.errors.invalidCartId",
  "Invalid user id for clear cart.": "cart.errors.invalidUserIdClear",
  "Invalid user id.": "cart.errors.invalidUserId",
  "Invalid conversation id.": "errors.invalidConversationId",
  "Invalid message id.": "errors.invalidMessageId",
  "Invalid participant id.": "errors.invalidParticipantId",
  "Missing conversation id for update.": "errors.invalidConversationId",
};

/**
 * Promo validate API / client reason strings → `cart.promoErrors.*` keys.
 */
const PROMO_REASON_KEY_MAP: Record<string, string> = {
  "Promo code is required": "cart.promoErrors.required",
  "Cart is empty": "cart.promoErrors.cartEmpty",
  "Could not validate promo code": "cart.promoErrors.validateFailed",
  "Invalid promo code": "cart.promoErrors.invalid",
  "Invalid response": "cart.promoErrors.validateFailed",
  "This promotion is no longer available": "cart.promoErrors.unavailable",
  "This promotion is inactive": "cart.promoErrors.inactive",
  "This promotion has not started yet": "cart.promoErrors.notStarted",
  "This promotion has expired": "cart.promoErrors.expired",
  "This promo code has reached its usage limit": "cart.promoErrors.usageLimit",
  "Invalid promotion configuration": "cart.promoErrors.invalidConfig",
  "Could not load product prices": "cart.promoErrors.priceLoadFailed",
  "Product price missing for cart line": "cart.promoErrors.priceMissing",
  "This promo does not apply to items in your cart": "cart.promoErrors.notApplicable",
  "This promo does not apply to items in your bag": "cart.promoErrors.notApplicable",
  "No discount applicable": "cart.promoErrors.noDiscount",
};

/**
 * Checkout / payment API error strings → `checkout.apiErrors.*` keys.
 */
const CHECKOUT_API_ERROR_KEY_MAP: Record<string, string> = {
  "Failed to load cart": "checkout.apiErrors.failedToLoadCart",
  "Cart is empty": "checkout.apiErrors.cartEmpty",
  "Product price missing for a cart line": "checkout.apiErrors.productPriceMissing",
  "Computed subtotal must be positive": "checkout.apiErrors.subtotalMustBePositive",
  "Failed to create pending order": "checkout.apiErrors.createPendingFailed",
  "Could not create pending order": "checkout.apiErrors.createPendingFailed",
  "Failed to load order": "checkout.apiErrors.failedToLoadOrder",
  "Order not found": "checkout.apiErrors.orderNotFound",
  "Order does not belong to user": "checkout.apiErrors.orderNotBelong",
  "Order is not pending": "checkout.apiErrors.orderNotPending",
  "Order total does not match current cart": "checkout.apiErrors.orderTotalMismatch",
  "Missing client secret from Stripe": "checkout.apiErrors.missingClientSecret",
  "PaymentIntent creation failed": "checkout.apiErrors.paymentIntentFailed",
  "Could not create payment intent": "checkout.apiErrors.paymentIntentFailed",
  "Could not fetch delivery rates": "checkout.ratesFetchFailed",
  "Invalid response from delivery/rates": "checkout.apiErrors.generic",
  "Invalid response from create-pending-order": "checkout.apiErrors.generic",
  "Invalid response from create-payment-intent": "checkout.apiErrors.generic",
};

/**
 * Maps a raw Supabase or auth error string to a translation key.
 * Falls back to `errors.networkError` when no mapping exists.
 */
export function getErrorTranslationKey(raw: string): string {
  const trimmed = raw.trim();
  const mapped = ERROR_KEY_MAP[trimmed];
  if (mapped) {
    return mapped;
  }
  // Supabase sometimes varies casing; normalize known auth messages.
  if (trimmed.toLowerCase() === "invalid login credentials") {
    return "errors.invalidCredentials";
  }
  return "errors.networkError";
}

/**
 * Maps a promo validation reason to a `cart.promoErrors.*` key.
 * Falls back to `cart.promoErrors.generic` when unknown.
 */
export function getPromoErrorTranslationKey(raw: string): string {
  const trimmed = raw.trim();
  const mapped = PROMO_REASON_KEY_MAP[trimmed];
  if (mapped) {
    return mapped;
  }
  return "cart.promoErrors.generic";
}

/**
 * Maps a checkout / payment / delivery API error to a translation key.
 * Falls back to `checkout.apiErrors.generic` when unknown.
 */
export function getCheckoutApiErrorTranslationKey(raw: string): string {
  const trimmed = raw.trim();
  const mapped = CHECKOUT_API_ERROR_KEY_MAP[trimmed];
  if (mapped) {
    return mapped;
  }
  // Promo reasons may surface as create-pending-order errors
  const promoMapped = PROMO_REASON_KEY_MAP[trimmed];
  if (promoMapped) {
    return promoMapped;
  }
  return "checkout.apiErrors.generic";
}
