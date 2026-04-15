import { NextResponse } from "next/server";

import { delyvaGetOrder } from "@/app/api/_lib/delyva";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { isUuid } from "@/app/api/_lib/validation";

import type { Json } from "@/database.types";

type OrderTrackSelect = {
  delyva_order_id: string | null;
};

function parseDelyvaNumericId(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

function extractTrackingPayload(details: unknown): {
  statusCode: number | null;
  status: string | null;
  trackingEvents: Json;
} {
  if (typeof details !== "object" || details === null) {
    return { statusCode: null, status: null, trackingEvents: [] };
  }
  const d = details as Record<string, unknown>;
  const statusCode =
    typeof d.statusCode === "number" && Number.isFinite(d.statusCode) ? d.statusCode : null;
  const status = typeof d.status === "string" ? d.status : null;

  const eventsCandidate = d.trackingHistory ?? d.trackingEvents ?? d.activities ?? d.events;
  let trackingEvents: Json = [];
  if (Array.isArray(eventsCandidate)) {
    trackingEvents = eventsCandidate as Json;
  } else if (eventsCandidate !== undefined && eventsCandidate !== null) {
    trackingEvents = eventsCandidate as Json;
  }

  return { statusCode, status, trackingEvents };
}

type RouteParams = { params: { orderId: string } };

/**
 * GET /api/delivery/tracking/[orderId]
 *
 * Loads the order’s `delyva_order_id`, fetches Delyva `GET /order/{id}`, and returns a normalized
 * tracking payload for the customer/admin UI (Step 9).
 */
export async function GET(_request: Request, context: RouteParams): Promise<NextResponse> {
  const orderId = context.params.orderId;
  if (typeof orderId !== "string" || !isUuid(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: orderRow, error } = await supabase
    .from("orders")
    .select("delyva_order_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error !== null) {
    console.error("delivery/tracking: order load", error.message);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
  if (orderRow === null) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderRow as OrderTrackSelect;
  const rawDelyvaId = order.delyva_order_id;
  if (rawDelyvaId === null || rawDelyvaId.length === 0) {
    return NextResponse.json({ error: "Order has no Delyva shipment yet" }, { status: 400 });
  }

  const numericId = parseDelyvaNumericId(rawDelyvaId);
  if (numericId === null) {
    return NextResponse.json({ error: "Invalid delyva_order_id on order" }, { status: 500 });
  }

  let details: unknown;
  try {
    details = await delyvaGetOrder(numericId);
  } catch (e) {
    console.error("delivery/tracking: delyvaGetOrder", e);
    return NextResponse.json({ error: "Failed to fetch Delyva order" }, { status: 502 });
  }

  const { statusCode, status, trackingEvents } = extractTrackingPayload(details);
  return NextResponse.json({ statusCode, status, trackingEvents });
}
