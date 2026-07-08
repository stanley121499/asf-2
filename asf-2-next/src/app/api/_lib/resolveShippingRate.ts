import {
  delyvaInstantQuote,
  getDelyvaCustomerId,
  getDelyvaOriginAddress,
  normalizeCountryForDelyva,
} from "@/app/api/_lib/delyva";
import { mapInstantQuoteServices, type NormalizedRate } from "@/app/api/_lib/delyvaQuoteMappers";
import { cartWeightPayload, type CartWeightLine } from "@/app/api/_lib/parcelWeight";

/** Flat shipping fallback when Delyva is unavailable or customer picks standard delivery. */
export const FLAT_SHIPPING_MYR = 10;

/** Client-visible service code for the flat-rate fallback option. */
export const FLAT_FALLBACK_SERVICE_CODE = "FLAT_STANDARD";

/**
 * Destination fields required for Delyva instantQuote.
 */
export interface DelyvaDestinationInput {
  address1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export type ResolveShippingResult =
  | { ok: true; shippingRateMyr: number; courierCode: string; rateName: string }
  | { ok: false; message: string };

/**
 * Returns true when the service code is the built-in flat-rate fallback.
 */
export function isFlatFallbackServiceCode(serviceCode: string): boolean {
  return serviceCode.trim() === FLAT_FALLBACK_SERVICE_CODE;
}

/**
 * Fetches live Delyva rates for a cart + destination and returns the matching service.
 */
export async function fetchDelyvaRatesForCart(
  cartRows: CartWeightLine[],
  destination: DelyvaDestinationInput,
): Promise<NormalizedRate[]> {
  const origin = getDelyvaOriginAddress();
  const customerId = getDelyvaCustomerId();
  const weight = cartWeightPayload(cartRows);

  const payload: Record<string, unknown> = {
    customerId,
    origin,
    destination: {
      address1: destination.address1,
      city: destination.city,
      state: destination.state,
      postcode: destination.postcode,
      country: normalizeCountryForDelyva(destination.country),
    },
    weight: { unit: "kg", value: weight.value },
    itemType: "PARCEL",
  };

  const raw = await delyvaInstantQuote(payload);
  return mapInstantQuoteServices(raw);
}

/**
 * Resolves shipping rate and courier code for checkout.
 *
 * - `FLAT_FALLBACK_SERVICE_CODE` → flat RM 10 without calling Delyva.
 * - Any other code → re-quote via Delyva and match server-side (never trust client price).
 */
export async function resolveShippingForServiceCode(
  serviceCode: string,
  cartRows: CartWeightLine[],
  destination: DelyvaDestinationInput,
): Promise<ResolveShippingResult> {
  const trimmed = serviceCode.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: "serviceCode is required" };
  }

  if (isFlatFallbackServiceCode(trimmed)) {
    return {
      ok: true,
      shippingRateMyr: FLAT_SHIPPING_MYR,
      courierCode: FLAT_FALLBACK_SERVICE_CODE,
      rateName: "标准配送",
    };
  }

  let rates: NormalizedRate[];
  try {
    rates = await fetchDelyvaRatesForCart(cartRows, destination);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch delivery rates";
    return { ok: false, message: msg };
  }

  const match = rates.find((r) => r.serviceCode === trimmed);
  if (match === undefined) {
    return { ok: false, message: "Selected courier is no longer available. Please choose again." };
  }
  if (!Number.isFinite(match.price) || match.price < 0) {
    return { ok: false, message: "Invalid shipping rate from courier" };
  }

  return {
    ok: true,
    shippingRateMyr: match.price,
    courierCode: match.serviceCode,
    rateName: match.name,
  };
}
