import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/database.types";
import { isOrderDelivered } from "@/lib/claims/claimEligibility";

type SupabaseDbClient = SupabaseClient<Database>;

/** Result of delivery date resolution for warranty tier timing. */
export interface DeliveryDateResult {
  deliveryDate: string | null;
  source: "order_status_logs" | "order_updated_at" | "none";
}

/**
 * Fetches the first delivered timestamp from order_status_logs.
 * Falls back to order.created_at when status is delivered/completed.
 */
export async function resolveDeliveryDate(
  supabase: SupabaseDbClient,
  orderId: string
): Promise<DeliveryDateResult> {
  const { data: logRow, error: logError } = await supabase
    .from("order_status_logs")
    .select("created_at")
    .eq("order_id", orderId)
    .eq("new_status", "delivered")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (logError !== null) {
    console.error("resolveDeliveryDate: status log query", logError.message);
  }

  if (logRow !== null && logRow.created_at.length > 0) {
    return { deliveryDate: logRow.created_at, source: "order_status_logs" };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError !== null) {
    console.error("resolveDeliveryDate: order query", orderError.message);
    return { deliveryDate: null, source: "none" };
  }

  if (order === null) {
    return { deliveryDate: null, source: "none" };
  }

  if (isOrderDelivered(order.status)) {
    return { deliveryDate: order.created_at, source: "order_updated_at" };
  }

  return { deliveryDate: null, source: "none" };
}

/**
 * Computes whole days between delivery and a reference date.
 */
export function computeDaysSinceDelivery(
  deliveryDateIso: string,
  referenceDate: Date = new Date()
): number {
  const delivery = new Date(deliveryDateIso);
  if (Number.isNaN(delivery.getTime())) {
    return -1;
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = referenceDate.getTime() - delivery.getTime();
  return Math.floor(diffMs / msPerDay);
}
