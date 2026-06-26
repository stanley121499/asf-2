import type { User } from "@supabase/supabase-js";

import type { Database } from "@/database.types";
import type { ShippingAddressStructured } from "@/lib/checkoutApi";
import { supabase } from "@/lib/supabase";

type UserDetailRow = Database["public"]["Tables"]["user_details"]["Row"];

/**
 * Checkout shipping form fields persisted across sessions.
 */
export interface ShippingFormFields {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  stateRegion: string;
  postcode: string;
  country: string;
  recipientPhone: string;
}

const EMPTY_FORM: ShippingFormFields = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  stateRegion: "",
  postcode: "",
  country: "Malaysia",
  recipientPhone: "",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Reads the first matching string from auth user metadata for address prefill.
 */
function readMetaString(meta: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = meta[key];
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }
  return "";
}

/**
 * Builds auth metadata patch from structured shipping + name fields.
 */
function buildMetadataPatch(
  structured: ShippingAddressStructured,
  firstName: string,
  lastName: string
): Record<string, string> {
  return {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    phone: structured.recipientPhone.trim(),
    address_line1: structured.address1.trim(),
    address_line2: structured.address2.trim(),
    postcode: structured.postcode.trim(),
    country: structured.country.trim(),
  };
}

/**
 * Loads saved shipping fields from `user_details` and auth user metadata.
 * Matches the web checkout prefill keys so both clients share the same profile data.
 */
export async function loadSavedShippingAddress(user: User): Promise<ShippingFormFields> {
  const meta: Record<string, unknown> =
    user.user_metadata !== null &&
    typeof user.user_metadata === "object" &&
    !Array.isArray(user.user_metadata)
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  const { data: detail, error } = await supabase
    .from("user_details")
    .select("first_name, last_name, city, state")
    .eq("id", user.id)
    .maybeSingle();

  if (error !== null) {
    console.warn("Could not load user_details for shipping prefill:", error.message);
  }

  const row: Partial<UserDetailRow> = detail ?? {};

  return {
    firstName: isNonEmptyString(row.first_name)
      ? row.first_name.trim()
      : readMetaString(meta, ["first_name"]) || EMPTY_FORM.firstName,
    lastName: isNonEmptyString(row.last_name)
      ? row.last_name.trim()
      : readMetaString(meta, ["last_name"]) || EMPTY_FORM.lastName,
    city: isNonEmptyString(row.city) ? row.city.trim() : EMPTY_FORM.city,
    stateRegion: isNonEmptyString(row.state) ? row.state.trim() : EMPTY_FORM.stateRegion,
    address1: readMetaString(meta, ["address_line1", "line1", "address1"]),
    address2: readMetaString(meta, ["address_line2", "line2", "address2"]),
    postcode: readMetaString(meta, ["postcode", "postal_code", "zip"]),
    country: readMetaString(meta, ["country"]) || EMPTY_FORM.country,
    recipientPhone: readMetaString(meta, ["phone"]),
  };
}

/**
 * Persists shipping info to `user_details` and auth metadata so the next checkout is pre-filled.
 * Failures are logged but do not block checkout.
 */
export async function saveShippingAddress(
  userId: string,
  structured: ShippingAddressStructured,
  firstName: string,
  lastName: string
): Promise<void> {
  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();

  const { error: detailError } = await supabase
    .from("user_details")
    .update({
      first_name: trimmedFirst,
      last_name: trimmedLast,
      city: structured.city.trim(),
      state: structured.state.trim(),
    })
    .eq("id", userId);

  if (detailError !== null) {
    console.warn("Could not save shipping to user_details:", detailError.message);
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: buildMetadataPatch(structured, trimmedFirst, trimmedLast),
  });

  if (authError !== null) {
    console.warn("Could not save shipping to auth metadata:", authError.message);
  }
}
