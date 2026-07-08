/**
 * Client-side helpers for checkout delivery / courier selection (web).
 */

/** Flat shipping fallback when Delyva is unavailable (must match server). */
export const FLAT_SHIPPING_MYR = 10;

/** Service code for flat fallback (must match server). */
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
 * POST `/api/delivery/rates` — live courier options for cart + destination.
 */
export async function fetchDeliveryRates(payload: {
  userId: string;
  destination: {
    address1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}): Promise<DeliveryRateOption[]> {
  const res = await fetch("/api/delivery/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: payload.userId,
      destination: payload.destination,
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
 * Formats ETA days for display.
 */
export function formatDeliveryEta(etaDays: number | null): string {
  if (etaDays === null || !Number.isFinite(etaDays)) {
    return "";
  }
  if (etaDays <= 1) {
    return "预计 1 天内送达";
  }
  return `预计 ${Math.round(etaDays)} 天送达`;
}
