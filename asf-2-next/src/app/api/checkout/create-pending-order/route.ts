import { NextResponse } from "next/server";

import {
  normalizePromoCode,
  validatePromotionForCart,
} from "@/app/api/_lib/promotions";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { isUuid } from "@/app/api/_lib/validation";

import type { Database, Json } from "@/database.types";

type CartRow = Database["public"]["Tables"]["add_to_carts"]["Row"] & {
  products: { price: number } | null;
};

/** Flat shipping in MYR (Step 3 — same until Delivery UI). */
const FLAT_SHIPPING_MYR = 10;

/**
 * Structured shipping address stored on `orders.shipping_address_structured` and used by Delyva.
 */
interface ShippingAddressStructured {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  recipientName: string;
  recipientPhone: string;
}

/**
 * Converts a validated structured address into Supabase `Json` (no unsafe casts).
 */
function structuredToJson(s: ShippingAddressStructured): Json {
  return {
    address1: s.address1,
    address2: s.address2,
    city: s.city,
    state: s.state,
    postcode: s.postcode,
    country: s.country,
    recipientName: s.recipientName,
    recipientPhone: s.recipientPhone,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates request body and returns a typed structured address or an error message.
 */
function parseStructuredAddress(value: unknown): ShippingAddressStructured | string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "shipping_address_structured must be an object";
  }
  const o = value as Record<string, unknown>;
  const address1 = o["address1"];
  const address2 = o["address2"];
  const city = o["city"];
  const state = o["state"];
  const postcode = o["postcode"];
  const country = o["country"];
  const recipientName = o["recipientName"];
  const recipientPhone = o["recipientPhone"];

  if (!isNonEmptyString(address1)) {
    return "address1 is required";
  }
  if (typeof address2 !== "string") {
    return "address2 must be a string";
  }
  if (!isNonEmptyString(city)) {
    return "city is required";
  }
  if (!isNonEmptyString(state)) {
    return "state is required";
  }
  if (!isNonEmptyString(postcode)) {
    return "postcode is required";
  }
  if (!isNonEmptyString(country)) {
    return "country is required";
  }
  if (!isNonEmptyString(recipientName)) {
    return "recipientName is required";
  }
  if (!isNonEmptyString(recipientPhone)) {
    return "recipientPhone is required";
  }

  return {
    address1: address1.trim(),
    address2: address2.trim(),
    city: city.trim(),
    state: state.trim(),
    postcode: postcode.trim(),
    country: country.trim(),
    recipientName: recipientName.trim(),
    recipientPhone: recipientPhone.trim(),
  };
}

/**
 * POST /api/checkout/create-pending-order
 *
 * Creates a `pending` order with shipping addresses and server-computed totals (cart + flat shipping).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const userId = (body as { userId?: unknown }).userId;
  const shippingAddress = (body as { shipping_address?: unknown }).shipping_address;
  const structuredRaw = (body as { shipping_address_structured?: unknown }).shipping_address_structured;
  const promoCodeRaw = (body as { promoCode?: unknown }).promoCode;
  const promotionIdRaw = (body as { promotionId?: unknown }).promotionId;

  if (typeof userId !== "string" || !isUuid(userId)) {
    return NextResponse.json({ error: "userId must be a valid UUID" }, { status: 400 });
  }
  if (typeof shippingAddress !== "string" || !isNonEmptyString(shippingAddress)) {
    return NextResponse.json({ error: "shipping_address must be a non-empty string" }, { status: 400 });
  }

  const structured = parseStructuredAddress(structuredRaw);
  if (typeof structured === "string") {
    return NextResponse.json({ error: structured }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: cartRows, error: cartError } = await supabase
    .from("add_to_carts")
    .select("id, user_id, product_id, color_id, size_id, amount, products ( price )")
    .eq("user_id", userId);

  if (cartError !== null) {
    console.error("create-pending-order: cart query", cartError.message);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }

  const rows = (cartRows ?? []) as CartRow[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 404 });
  }

  let subtotalMyr = 0;
  for (const row of rows) {
    const price = row.products?.price;
    if (price === undefined || !Number.isFinite(price)) {
      return NextResponse.json({ error: "Product price missing for a cart line" }, { status: 500 });
    }
    subtotalMyr += price * row.amount;
  }

  if (subtotalMyr <= 0) {
    return NextResponse.json({ error: "Computed subtotal must be positive" }, { status: 400 });
  }

  const cartLines = rows.map((row) => ({
    product_id: row.product_id,
    amount: row.amount,
  }));

  let discountAmountMyr = 0;
  let promoCodeStored: string | null = null;
  let promotionIdForIncrement: string | null = null;

  if (typeof promoCodeRaw === "string" && promoCodeRaw.trim().length > 0) {
    const validated = await validatePromotionForCart(
      supabase,
      promoCodeRaw,
      cartLines
    );
    if (validated.valid === false) {
      return NextResponse.json({ error: validated.reason }, { status: 400 });
    }
    if (
      typeof promotionIdRaw === "string" &&
      isUuid(promotionIdRaw) &&
      promotionIdRaw !== validated.promotionId
    ) {
      return NextResponse.json(
        { error: "Promotion does not match the applied code" },
        { status: 400 }
      );
    }
    discountAmountMyr = validated.discountAmountMyr;
    promoCodeStored = normalizePromoCode(promoCodeRaw);
    promotionIdForIncrement = validated.promotionId;
  } else if (promotionIdRaw !== undefined && promotionIdRaw !== null) {
    return NextResponse.json(
      { error: "promoCode is required when promotionId is sent" },
      { status: 400 }
    );
  }

  const totalMyr = Math.max(
    0,
    subtotalMyr + FLAT_SHIPPING_MYR - discountAmountMyr
  );

  if (totalMyr <= 0) {
    return NextResponse.json(
      { error: "Order total must be greater than zero after discount" },
      { status: 400 }
    );
  }

  const structuredJson = structuredToJson(structured);

  const { data: inserted, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: totalMyr,
      shipping_address: shippingAddress.trim(),
      shipping_address_structured: structuredJson,
      shipping_rate: FLAT_SHIPPING_MYR,
      promo_code: promoCodeStored,
      discount_amount: discountAmountMyr,
    })
    .select("id")
    .single();

  if (insertError !== null || inserted === null) {
    console.error("create-pending-order: insert", insertError?.message);
    return NextResponse.json({ error: "Failed to create pending order" }, { status: 500 });
  }

  if (promotionIdForIncrement !== null) {
    const { data: promoRow, error: promoFetchErr } = await supabase
      .from("promotions")
      .select("uses_count")
      .eq("id", promotionIdForIncrement)
      .maybeSingle();

    if (promoFetchErr !== null || promoRow === null) {
      await supabase.from("orders").delete().eq("id", inserted.id);
      console.error("create-pending-order: promotion fetch", promoFetchErr?.message);
      return NextResponse.json(
        { error: "Failed to finalize promotion" },
        { status: 500 }
      );
    }

    const currentUses =
      typeof promoRow.uses_count === "number" && Number.isFinite(promoRow.uses_count)
        ? promoRow.uses_count
        : 0;
    const { error: promoUpdateErr } = await supabase
      .from("promotions")
      .update({ uses_count: currentUses + 1 })
      .eq("id", promotionIdForIncrement);

    if (promoUpdateErr !== null) {
      await supabase.from("orders").delete().eq("id", inserted.id);
      console.error("create-pending-order: promotion increment", promoUpdateErr.message);
      return NextResponse.json(
        { error: "Failed to finalize promotion" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ orderId: inserted.id });
}
