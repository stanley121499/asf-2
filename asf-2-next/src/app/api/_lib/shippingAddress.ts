import type { Json } from "@/database.types";

/**
 * Machine-readable shipping address stored in `orders.shipping_address_structured` (JSONB).
 * Optional contact fields may be added at checkout (Step 3).
 */
export type ShippingAddressStructured = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
};

/**
 * Parses and validates structured shipping JSON from the database.
 */
export function parseShippingAddressStructured(value: Json | undefined): ShippingAddressStructured | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const rec = value as Record<string, Json | undefined>;
  const address1 = rec.address1;
  const city = rec.city;
  const state = rec.state;
  const postcode = rec.postcode;
  const country = rec.country;
  if (
    typeof address1 !== "string" ||
    typeof city !== "string" ||
    typeof state !== "string" ||
    typeof postcode !== "string" ||
    typeof country !== "string"
  ) {
    return null;
  }
  const address2 = rec.address2;
  const recipientName = rec.recipientName;
  const recipientPhone = rec.recipientPhone;
  const recipientEmail = rec.recipientEmail;
  return {
    address1,
    address2: typeof address2 === "string" ? address2 : undefined,
    city,
    state,
    postcode,
    country,
    recipientName: typeof recipientName === "string" ? recipientName : undefined,
    recipientPhone: typeof recipientPhone === "string" ? recipientPhone : undefined,
    recipientEmail: typeof recipientEmail === "string" ? recipientEmail : undefined,
  };
}
