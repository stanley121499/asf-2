import { getApiBaseUrl } from "@/lib/api";

/**
 * Structured shipping address — matches Next.js `shippingStructuredSchema`.
 */
export interface ShippingAddressStructured {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  recipientName: string;
  recipientPhone: string;
}

export interface CreatePendingOrderPayload {
  userId: string;
  shipping_address: string;
  shipping_address_structured: ShippingAddressStructured;
  promoCode?: string;
  promotionId?: string;
}

/**
 * POST /api/checkout/create-pending-order — returns `{ orderId }`.
 */
export async function postCreatePendingOrder(
  payload: CreatePendingOrderPayload
): Promise<string> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/checkout/create-pending-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : "Could not create pending order";
    throw new Error(msg);
  }
  if (
    typeof json !== "object" ||
    json === null ||
    !("orderId" in json) ||
    typeof (json as { orderId: unknown }).orderId !== "string"
  ) {
    throw new Error("Invalid response from create-pending-order");
  }
  return (json as { orderId: string }).orderId;
}

/**
 * POST /api/stripe/create-payment-intent — returns `{ clientSecret }`.
 */
export async function postCreatePaymentIntent(payload: {
  userId: string;
  orderId: string;
}): Promise<string> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/stripe/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : "Could not create payment intent";
    throw new Error(msg);
  }
  if (
    typeof json !== "object" ||
    json === null ||
    !("clientSecret" in json) ||
    typeof (json as { clientSecret: unknown }).clientSecret !== "string"
  ) {
    throw new Error("Invalid response from create-payment-intent");
  }
  return (json as { clientSecret: string }).clientSecret;
}
