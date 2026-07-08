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

/** Flat shipping fallback when Delyva is unavailable (must match server constant). */
export const FLAT_SHIPPING_MYR = 10;

/** Service code for flat fallback (must match server `FLAT_FALLBACK_SERVICE_CODE`). */
export const FLAT_FALLBACK_SERVICE_CODE = "FLAT_STANDARD";

/**
 * Normalized courier option from `/api/delivery/rates`.
 */
export interface DeliveryRateOption {
  serviceCode: string;
  name: string;
  price: number;
  currency: string;
  etaDays: number | null;
}

export interface CreatePendingOrderPayload {
  userId: string;
  shipping_address: string;
  shipping_address_structured: ShippingAddressStructured;
  promoCode?: string;
  promotionId?: string;
  serviceCode?: string;
}

/**
 * Builds the flat-rate fallback option shown when live quotes fail.
 */
export function buildFlatFallbackRate(): DeliveryRateOption {
  return {
    serviceCode: FLAT_FALLBACK_SERVICE_CODE,
    name: "标准配送",
    price: FLAT_SHIPPING_MYR,
    currency: "MYR",
    etaDays: null,
  };
}

/**
 * Maps common country labels to ISO codes expected by Delyva.
 */
export function normalizeCountryForDelyva(country: string): string {
  const trimmed = country.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "malaysia" || lower === "my") {
    return "MY";
  }
  return trimmed;
}

/**
 * Parses a single rate object from the API response.
 */
function parseRateItem(value: unknown): DeliveryRateOption | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const serviceCode = row.serviceCode;
  const name = row.name;
  const price = row.price;
  const currency = row.currency;
  const etaDays = row.etaDays;
  if (typeof serviceCode !== "string" || serviceCode.length === 0) {
    return null;
  }
  if (typeof name !== "string") {
    return null;
  }
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return null;
  }
  const currencyStr = typeof currency === "string" ? currency : "MYR";
  let eta: number | null = null;
  if (typeof etaDays === "number" && Number.isFinite(etaDays)) {
    eta = etaDays;
  }
  return {
    serviceCode,
    name,
    price,
    currency: currencyStr,
    etaDays: eta,
  };
}

/**
 * POST /api/delivery/rates — returns live courier options for the user's cart + destination.
 */
export async function postDeliveryRates(payload: {
  userId: string;
  destination: {
    address1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}): Promise<DeliveryRateOption[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/delivery/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: payload.userId,
      destination: {
        ...payload.destination,
        country: normalizeCountryForDelyva(payload.destination.country),
      },
    }),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : "Could not fetch delivery rates";
    throw new Error(msg);
  }
  if (typeof json !== "object" || json === null || !("rates" in json)) {
    throw new Error("Invalid response from delivery/rates");
  }
  const ratesRaw = (json as { rates: unknown }).rates;
  if (!Array.isArray(ratesRaw)) {
    return [];
  }
  const parsed: DeliveryRateOption[] = [];
  for (const item of ratesRaw) {
    const rate = parseRateItem(item);
    if (rate !== null) {
      parsed.push(rate);
    }
  }
  return parsed;
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
