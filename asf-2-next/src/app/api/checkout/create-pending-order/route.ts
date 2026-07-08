import { NextResponse } from "next/server";

import { createPendingOrderBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import {
  normalizePromoCode,
  validatePromotionForCart,
} from "@/app/api/_lib/promotions";
import {
  FLAT_SHIPPING_MYR,
  resolveShippingForServiceCode,
} from "@/app/api/_lib/resolveShippingRate";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { isUuid } from "@/app/api/_lib/validation";

import type { Database, Json } from "@/database.types";

type CartRow = Database["public"]["Tables"]["add_to_carts"]["Row"] & {
  products: { price: number } | null;
};

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

/**
 * POST /api/checkout/create-pending-order
 *
 * Creates a `pending` order with shipping addresses and server-computed totals
 * (cart + selected courier rate or flat fallback).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = createPendingOrderBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const {
    userId,
    shipping_address: shippingAddress,
    shipping_address_structured: structured,
    serviceCode: serviceCodeRaw,
  } = validated.data;
  const promoCodeRaw = validated.data.promoCode;
  const promotionIdRaw = validated.data.promotionId;

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
    const promoValidated = await validatePromotionForCart(
      supabase,
      promoCodeRaw,
      cartLines
    );
    if (promoValidated.valid === false) {
      return NextResponse.json({ error: promoValidated.reason }, { status: 400 });
    }
    if (
      typeof promotionIdRaw === "string" &&
      isUuid(promotionIdRaw) &&
      promotionIdRaw !== promoValidated.promotionId
    ) {
      return NextResponse.json(
        { error: "Promotion does not match the applied code" },
        { status: 400 }
      );
    }
    discountAmountMyr = promoValidated.discountAmountMyr;
    promoCodeStored = normalizePromoCode(promoCodeRaw);
    promotionIdForIncrement = promoValidated.promotionId;
  } else if (promotionIdRaw !== undefined && promotionIdRaw !== null) {
    return NextResponse.json(
      { error: "promoCode is required when promotionId is sent" },
      { status: 400 }
    );
  }

  let shippingRateMyr = FLAT_SHIPPING_MYR;
  let courierCode: string | null = null;

  if (typeof serviceCodeRaw === "string" && serviceCodeRaw.trim().length > 0) {
    const resolved = await resolveShippingForServiceCode(
      serviceCodeRaw,
      rows,
      {
        address1: structured.address1,
        city: structured.city,
        state: structured.state,
        postcode: structured.postcode,
        country: structured.country,
      },
    );
    if (resolved.ok === false) {
      return NextResponse.json({ error: resolved.message }, { status: 400 });
    }
    shippingRateMyr = resolved.shippingRateMyr;
    courierCode = resolved.courierCode;
  }

  const totalMyr = Math.max(
    0,
    subtotalMyr + shippingRateMyr - discountAmountMyr
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
      shipping_rate: shippingRateMyr,
      courier_code: courierCode,
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
