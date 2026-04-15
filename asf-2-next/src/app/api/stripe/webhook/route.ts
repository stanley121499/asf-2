import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { getStripe } from "@/app/api/_lib/stripe";
import { myrToSen, senToMyr } from "@/app/api/_lib/money";
import { isUuid } from "@/app/api/_lib/validation";

import type { Database, Json } from "@/database.types";

export const runtime = "nodejs";

type CartRow = Database["public"]["Tables"]["add_to_carts"]["Row"] & {
  products: { price: number } | null;
};

type PaymentStatus = Database["public"]["Enums"]["payment_status"];

const AMOUNT_TOLERANCE_SEN = 1;

/**
 * POST /api/stripe/webhook
 *
 * Verifies `Stripe-Signature`, then processes `payment_intent.succeeded` and
 * `payment_intent.payment_failed` events. On success: creates or updates `orders`,
 * `order_items`, `payments`, decrements `product_stock.count`, clears `add_to_carts`, inserts a
 * confirmation `notifications` row. Idempotent on `payments.stripe_payment_intent_id`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret === undefined || secret.length === 0) {
    console.error("stripe webhook: STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (signature === null || signature.length === 0) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("stripe webhook: signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const piObject = event.data.object;
    if (!isPaymentIntent(piObject)) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const result = await handlePaymentIntentSucceeded(event.id, piObject);
    if (result.error !== null) {
      console.error("stripe webhook: handlePaymentIntentSucceeded", result.error);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (event.type === "payment_intent.payment_failed") {
    const piObject = event.data.object;
    if (isPaymentIntent(piObject)) {
      await handlePaymentIntentFailed(piObject);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

function isPaymentIntent(value: Stripe.Event.Data["object"]): value is Stripe.PaymentIntent {
  return typeof value === "object" && value !== null && "object" in value && value.object === "payment_intent";
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const userId = pi.metadata["userId"];
  if (typeof userId !== "string" || !isUuid(userId)) {
    return;
  }
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "payment_failed",
    title: "Payment Failed",
    body: "Your payment could not be completed. Please try again or use a different card.",
  });
  if (error !== null) {
    console.error("stripe webhook: payment_failed notification", error.message);
  }
}

function cartSubtotalMyr(rows: CartRow[]): { ok: true; subtotal: number } | { ok: false; message: string } {
  if (rows.length === 0) {
    return { ok: false, message: "Cart empty" };
  }
  let totalMyr = 0;
  for (const row of rows) {
    const price = row.products?.price;
    if (price === undefined || !Number.isFinite(price)) {
      return { ok: false, message: "Product price missing for a cart line" };
    }
    totalMyr += price * row.amount;
  }
  return { ok: true, subtotal: totalMyr };
}

async function handlePaymentIntentSucceeded(
  stripeEventId: string,
  pi: Stripe.PaymentIntent,
): Promise<{ error: string | null }> {
  const userId = pi.metadata["userId"];
  if (typeof userId !== "string" || !isUuid(userId)) {
    return { error: "Missing or invalid userId in PaymentIntent metadata" };
  }

  const supabase = createServiceRoleClient();

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();

  if (existingPayment !== null) {
    return { error: null };
  }

  const orderIdMeta = pi.metadata["orderId"];
  if (typeof orderIdMeta === "string" && isUuid(orderIdMeta)) {
    return fulfillPendingOrder(supabase, stripeEventId, pi, userId, orderIdMeta);
  }

  return fulfillLegacyNewOrder(supabase, stripeEventId, pi, userId);
}

/**
 * Checkout flow with a pre-created pending order (metadata.orderId).
 */
async function fulfillPendingOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  stripeEventId: string,
  pi: Stripe.PaymentIntent,
  userId: string,
  orderId: string,
): Promise<{ error: string | null }> {
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .select("id, user_id, status, shipping_rate")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr !== null) {
    return { error: `Order query: ${orderErr.message}` };
  }
  if (orderRow === null) {
    return { error: "Order not found for PaymentIntent metadata" };
  }
  if (orderRow.user_id !== userId) {
    return { error: "Order user mismatch" };
  }
  if (orderRow.status !== "pending") {
    return { error: "Order is not pending" };
  }

  const { data: cartRows, error: cartError } = await supabase
    .from("add_to_carts")
    .select("id, user_id, product_id, color_id, size_id, amount, products ( price )")
    .eq("user_id", userId);

  if (cartError !== null) {
    return { error: `Cart query: ${cartError.message}` };
  }

  const rows = (cartRows ?? []) as CartRow[];
  const subResult = cartSubtotalMyr(rows);
  if (subResult.ok === false) {
    const emptyMeta: Json = { stripe_payment_intent_id: pi.id };
    const { error: nErr } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "order_fulfillment_error",
      title: "Payment received",
      body:
        "We received your payment but your cart was empty. Please contact support with your payment reference.",
      metadata: emptyMeta,
    });
    if (nErr !== null) {
      console.error("stripe webhook: empty cart notification", nErr.message);
    }
    return { error: "Cart empty at webhook" };
  }

  const subtotalMyr = subResult.subtotal;
  const shippingRate =
    typeof orderRow.shipping_rate === "number" && Number.isFinite(orderRow.shipping_rate)
      ? orderRow.shipping_rate
      : 0;

  const expectedSen = myrToSen(subtotalMyr + shippingRate);
  if (Math.abs(expectedSen - pi.amount) > AMOUNT_TOLERANCE_SEN) {
    return {
      error: `Amount mismatch: expected ${expectedSen} sen vs PI ${pi.amount} sen`,
    };
  }

  for (const row of rows) {
    const stockCheck = await ensureStockAvailable(supabase, row);
    if (stockCheck.ok === false) {
      const stockMeta: Json = { stripe_payment_intent_id: pi.id };
      const { error: nErr } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "order_fulfillment_error",
        title: "Inventory issue",
        body: `We could not complete your order (${stockCheck.message}). Support will contact you.`,
        metadata: stockMeta,
      });
      if (nErr !== null) {
        console.error("stripe webhook: stock error notification", nErr.message);
      }
      return { error: stockCheck.message };
    }
  }

  const nowIso = new Date().toISOString();
  const paidMyr = senToMyr(pi.amount);

  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status: "processing",
      total_amount: paidMyr,
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (updateErr !== null) {
    return { error: `Order update: ${updateErr.message}` };
  }

  const { error: logErr } = await supabase.from("order_status_logs").insert({
    order_id: orderId,
    old_status: "pending",
    new_status: "processing",
    changed_by: "stripe_webhook",
  });
  if (logErr !== null) {
    console.error("stripe webhook: order_status_logs insert", logErr.message);
  }

  for (const row of rows) {
    const { error: oiError } = await supabase.from("order_items").insert({
      order_id: orderId,
      product_id: row.product_id,
      color_id: row.color_id,
      size_id: row.size_id,
      amount: row.amount,
    });
    if (oiError !== null) {
      return { error: `order_items insert: ${oiError.message}` };
    }
  }

  const latestChargeId =
    pi.latest_charge === null
      ? null
      : typeof pi.latest_charge === "string"
        ? pi.latest_charge
        : pi.latest_charge.id;

  const paymentMeta: Json = {
    stripe_event_id: stripeEventId,
    stripe_payment_intent_id: pi.id,
  };

  const paymentPayload: Database["public"]["Tables"]["payments"]["Insert"] = {
    user_id: userId,
    order_id: orderId,
    amount_total: paidMyr,
    amount_subtotal: subtotalMyr,
    amount_shipping: shippingRate,
    currency: pi.currency,
    provider: "stripe",
    status: "succeeded" satisfies PaymentStatus,
    stripe_payment_intent_id: pi.id,
    latest_charge_id: latestChargeId,
    livemode: pi.livemode,
    metadata: paymentMeta,
    refund_status: "not_refunded",
    refunded_amount: 0,
    attempt_count: 1,
    updated_at: nowIso,
  };

  const { error: payError } = await supabase.from("payments").insert(paymentPayload);
  if (payError !== null) {
    return { error: `payments insert: ${payError.message}` };
  }

  for (const row of rows) {
    const dec = await decrementStockForLine(supabase, row);
    if (dec.ok === false) {
      return { error: dec.message };
    }
  }

  const { error: delError } = await supabase.from("add_to_carts").delete().eq("user_id", userId);
  if (delError !== null) {
    console.error("stripe webhook: cart delete", delError.message);
  }

  const shortRef = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "order_confirmed",
    title: "Order Confirmed",
    body: `Your order #${shortRef} has been confirmed.`,
    metadata: { order_id: orderId } as Json,
  });
  if (notifError !== null) {
    console.error("stripe webhook: notification", notifError.message);
  }

  return { error: null };
}

/**
 * Legacy PaymentIntents without metadata.orderId: create a new processing order from cart total only.
 */
async function fulfillLegacyNewOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  stripeEventId: string,
  pi: Stripe.PaymentIntent,
  userId: string,
): Promise<{ error: string | null }> {
  const { data: cartRows, error: cartError } = await supabase
    .from("add_to_carts")
    .select("id, user_id, product_id, color_id, size_id, amount, products ( price )")
    .eq("user_id", userId);

  if (cartError !== null) {
    return { error: `Cart query: ${cartError.message}` };
  }

  const rows = (cartRows ?? []) as CartRow[];
  if (rows.length === 0) {
    const emptyMeta: Json = { stripe_payment_intent_id: pi.id };
    const { error: nErr } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "order_fulfillment_error",
      title: "Payment received",
      body:
        "We received your payment but your cart was empty. Please contact support with your payment reference.",
      metadata: emptyMeta,
    });
    if (nErr !== null) {
      console.error("stripe webhook: empty cart notification", nErr.message);
    }
    return { error: "Cart empty at webhook" };
  }

  const subResult = cartSubtotalMyr(rows);
  if (subResult.ok === false) {
    return { error: subResult.message };
  }
  const totalMyr = subResult.subtotal;

  const expectedSen = myrToSen(totalMyr);
  if (Math.abs(expectedSen - pi.amount) > AMOUNT_TOLERANCE_SEN) {
    return {
      error: `Amount mismatch: cart ${expectedSen} sen vs PI ${pi.amount} sen`,
    };
  }

  for (const row of rows) {
    const stockCheck = await ensureStockAvailable(supabase, row);
    if (stockCheck.ok === false) {
      const stockMeta: Json = { stripe_payment_intent_id: pi.id };
      const { error: nErr } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "order_fulfillment_error",
        title: "Inventory issue",
        body: `We could not complete your order (${stockCheck.message}). Support will contact you.`,
        metadata: stockMeta,
      });
      if (nErr !== null) {
        console.error("stripe webhook: stock error notification", nErr.message);
      }
      return { error: stockCheck.message };
    }
  }

  const nowIso = new Date().toISOString();
  const paidMyr = senToMyr(pi.amount);

  const { data: orderInsert, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "processing",
      total_amount: paidMyr,
    })
    .select("id")
    .single();

  if (orderError !== null || orderInsert === null) {
    return { error: `Order insert: ${orderError?.message ?? "no row"}` };
  }

  const newOrderId = orderInsert.id;

  for (const row of rows) {
    const { error: oiError } = await supabase.from("order_items").insert({
      order_id: newOrderId,
      product_id: row.product_id,
      color_id: row.color_id,
      size_id: row.size_id,
      amount: row.amount,
    });
    if (oiError !== null) {
      return { error: `order_items insert: ${oiError.message}` };
    }
  }

  const latestChargeId =
    pi.latest_charge === null
      ? null
      : typeof pi.latest_charge === "string"
        ? pi.latest_charge
        : pi.latest_charge.id;

  const paymentMeta: Json = {
    stripe_event_id: stripeEventId,
    stripe_payment_intent_id: pi.id,
  };

  const paymentPayload: Database["public"]["Tables"]["payments"]["Insert"] = {
    user_id: userId,
    order_id: newOrderId,
    amount_total: paidMyr,
    amount_subtotal: totalMyr,
    amount_shipping: null,
    currency: pi.currency,
    provider: "stripe",
    status: "succeeded" satisfies PaymentStatus,
    stripe_payment_intent_id: pi.id,
    latest_charge_id: latestChargeId,
    livemode: pi.livemode,
    metadata: paymentMeta,
    refund_status: "not_refunded",
    refunded_amount: 0,
    attempt_count: 1,
    updated_at: nowIso,
  };

  const { error: payError } = await supabase.from("payments").insert(paymentPayload);
  if (payError !== null) {
    return { error: `payments insert: ${payError.message}` };
  }

  for (const row of rows) {
    const dec = await decrementStockForLine(supabase, row);
    if (dec.ok === false) {
      return { error: dec.message };
    }
  }

  const { error: delError } = await supabase.from("add_to_carts").delete().eq("user_id", userId);
  if (delError !== null) {
    console.error("stripe webhook: cart delete", delError.message);
  }

  const shortRef = newOrderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "order_confirmed",
    title: "Order Confirmed",
    body: `Your order #${shortRef} has been confirmed.`,
    metadata: { order_id: newOrderId } as Json,
  });
  if (notifError !== null) {
    console.error("stripe webhook: notification", notifError.message);
  }

  return { error: null };
}

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function ensureStockAvailable(
  supabase: ServiceClient,
  row: CartRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let q = supabase
    .from("product_stock")
    .select("id, count")
    .eq("product_id", row.product_id);
  if (row.color_id === null) {
    q = q.is("color_id", null);
  } else {
    q = q.eq("color_id", row.color_id);
  }
  if (row.size_id === null) {
    q = q.is("size_id", null);
  } else {
    q = q.eq("size_id", row.size_id);
  }
  const { data, error } = await q.maybeSingle();
  if (error !== null) {
    return { ok: false, message: `Stock lookup failed: ${error.message}` };
  }
  if (data === null) {
    return { ok: false, message: "No stock row for a cart variant" };
  }
  if (data.count < row.amount) {
    return { ok: false, message: "Insufficient stock for a line item" };
  }
  return { ok: true };
}

async function decrementStockForLine(
  supabase: ServiceClient,
  row: CartRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let q = supabase
    .from("product_stock")
    .select("id, count")
    .eq("product_id", row.product_id);
  if (row.color_id === null) {
    q = q.is("color_id", null);
  } else {
    q = q.eq("color_id", row.color_id);
  }
  if (row.size_id === null) {
    q = q.is("size_id", null);
  } else {
    q = q.eq("size_id", row.size_id);
  }
  const { data, error } = await q.maybeSingle();
  if (error !== null || data === null) {
    return { ok: false, message: "Stock row missing during decrement" };
  }
  const next = data.count - row.amount;
  if (next < 0) {
    return { ok: false, message: "Negative stock after concurrent update" };
  }
  const { error: uErr } = await supabase
    .from("product_stock")
    .update({ count: next })
    .eq("id", data.id);
  if (uErr !== null) {
    return { ok: false, message: uErr.message };
  }
  return { ok: true };
}
