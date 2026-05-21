import { NextResponse } from "next/server";

import { createPaymentIntentBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { getPaymentIntentRateLimiter, getClientIp } from "@/app/api/_lib/rateLimit";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { getStripe } from "@/app/api/_lib/stripe";
import { myrToSen } from "@/app/api/_lib/money";

import type { Database } from "@/database.types";

type CartRow = Database["public"]["Tables"]["add_to_carts"]["Row"] & {
  products: { price: number } | null;
};

/**
 * Computes cart subtotal in MYR from joined cart rows.
 */
function subtotalMyrFromRows(rows: CartRow[]): number {
  let totalMyr = 0;
  for (const row of rows) {
    const price = row.products?.price;
    if (price === undefined || !Number.isFinite(price)) {
      throw new Error("Product price missing for a cart line");
    }
    totalMyr += price * row.amount;
  }
  return totalMyr;
}

/**
 * POST /api/stripe/create-payment-intent
 *
 * Body:
 * - `{ "userId": "<uuid>" }` — legacy: cart total only (no shipping).
 * - `{ "userId": "<uuid>", "orderId": "<uuid>" }` — pending order checkout: subtotal + order shipping_rate.
 *
 * Computes the charge server-side and creates a Stripe PaymentIntent in MYR.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const limiter = getPaymentIntentRateLimiter();
  const limited = await limiter(ip);
  if (limited.ok === false) {
    return limited.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = createPaymentIntentBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { userId, orderId: orderIdOptional } = validated.data;
  const orderId = orderIdOptional ?? null;

  const supabase = createServiceRoleClient();
  const { data: cartRows, error: cartError } = await supabase
    .from("add_to_carts")
    .select("id, user_id, product_id, color_id, size_id, amount, products ( price )")
    .eq("user_id", userId);

  if (cartError !== null) {
    console.error("create-payment-intent: cart query", cartError.message);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }

  const rows = (cartRows ?? []) as CartRow[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 404 });
  }

  let subtotalMyr: number;
  try {
    subtotalMyr = subtotalMyrFromRows(rows);
  } catch {
    return NextResponse.json({ error: "Product price missing for a cart line" }, { status: 500 });
  }

  if (subtotalMyr <= 0) {
    return NextResponse.json({ error: "Computed subtotal must be positive" }, { status: 400 });
  }

  let amountSen: number;
  let metadata: Record<string, string>;

  if (orderId !== null) {
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, status, total_amount, shipping_rate, discount_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr !== null) {
      console.error("create-payment-intent: order query", orderErr.message);
      return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
    }
    if (orderRow === null) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (orderRow.user_id !== userId) {
      return NextResponse.json({ error: "Order does not belong to user" }, { status: 403 });
    }
    if (orderRow.status !== "pending") {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
    }

    const shippingRate =
      typeof orderRow.shipping_rate === "number" && Number.isFinite(orderRow.shipping_rate)
        ? orderRow.shipping_rate
        : 0;

    const rawDiscount = orderRow.discount_amount;
    const discountMyr =
      typeof rawDiscount === "number" && Number.isFinite(rawDiscount) && rawDiscount > 0
        ? rawDiscount
        : 0;

    const expectedTotal = Math.max(
      0,
      subtotalMyr + shippingRate - discountMyr
    );
    const orderTotal = orderRow.total_amount;
    if (
      typeof orderTotal !== "number" ||
      !Number.isFinite(orderTotal) ||
      Math.abs(orderTotal - expectedTotal) > 0.02
    ) {
      return NextResponse.json({ error: "Order total does not match current cart" }, { status: 400 });
    }

    amountSen = myrToSen(expectedTotal);
    metadata = { userId, orderId };
  } else {
    amountSen = myrToSen(subtotalMyr);
    metadata = { userId };
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountSen,
      currency: "myr",
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    const clientSecret = paymentIntent.client_secret;
    if (clientSecret === null) {
      return NextResponse.json({ error: "Missing client secret from Stripe" }, { status: 500 });
    }
    return NextResponse.json({ clientSecret });
  } catch (e) {
    console.error("create-payment-intent: Stripe", e);
    return NextResponse.json({ error: "PaymentIntent creation failed" }, { status: 500 });
  }
}
