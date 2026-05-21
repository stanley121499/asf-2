import { NextResponse } from "next/server";

import { deliveryCreateShipmentBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import {
  delyvaCreateOrder,
  delyvaGetLabelUrl,
  delyvaGetOrder,
  delyvaProcessOrder,
  formatDelyvaScheduledMalaysia,
  getDelyvaCustomerId,
  getDelyvaOriginAddress,
} from "@/app/api/_lib/delyva";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { parseShippingAddressStructured } from "@/app/api/_lib/shippingAddress";

import type { Database } from "@/database.types";

type DimInput = { unit: "cm"; width: number; length: number; height: number };

/** Default parcel box when the client omits `dimensions` (Step 9 admin ship modal). */
const DEFAULT_PARCEL_DIMENSIONS_CM: DimInput = {
  unit: "cm",
  width: 30,
  length: 30,
  height: 20,
};

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderShipmentPick = Pick<
  OrderRow,
  "id" | "total_amount" | "shipping_address" | "shipping_address_structured" | "user_id"
>;

function readDelyvaOrderId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readStringField(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) {
      return v;
    }
  }
  return null;
}

/**
 * POST /api/delivery/create-shipment
 *
 * Books a Delyva shipment for an existing order (draft `POST /order`, then `POST /order/{id}/process`,
 * then label URL). Updates `orders` with tracking, courier, Delyva id, label URL, and status
 * `awaiting_pickup`. Requires `shipping_address_structured` JSON on the order (Phase 0b).
 * Body: `orderId`, `serviceCode`, `weight`; `dimensions` optional (defaults to a 30×30×20 cm parcel).
 *
 * **Security:** Route is not behind RBAC yet; restrict network access or add auth in Step 9/12.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }
  const validated = deliveryCreateShipmentBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }
  const { orderId: orderIdRaw, serviceCode, weight, dimensions } = validated.data;

  let resolvedDimensions: DimInput;
  if (dimensions === undefined) {
    resolvedDimensions = DEFAULT_PARCEL_DIMENSIONS_CM;
  } else {
    resolvedDimensions = dimensions;
  }

  const supabase = createServiceRoleClient();
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id, total_amount, shipping_address, shipping_address_structured, user_id")
    .eq("id", orderIdRaw)
    .maybeSingle();

  if (orderError !== null) {
    console.error("create-shipment: order load", orderError.message);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
  if (orderRow === null) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order: OrderShipmentPick = orderRow;
  const structured = parseShippingAddressStructured(order.shipping_address_structured);
  if (structured === null) {
    return NextResponse.json(
      {
        error:
          "Order is missing shipping_address_structured. Save structured address at checkout before booking shipment.",
      },
      { status: 400 },
    );
  }

  let originAddr;
  let customerId: number;
  try {
    originAddr = getDelyvaOriginAddress();
    customerId = getDelyvaCustomerId();
  } catch (e) {
    console.error("create-shipment: env", e);
    return NextResponse.json({ error: "Delivery configuration error" }, { status: 500 });
  }

  const senderName = process.env.DELYVA_SENDER_NAME ?? "ASF Fulfillment";
  const senderPhone = process.env.DELYVA_SENDER_PHONE ?? "";
  if (senderPhone.length === 0) {
    return NextResponse.json(
      { error: "Set DELYVA_SENDER_PHONE for the sender phone number used by Delyva." },
      { status: 500 },
    );
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  const senderEmail =
    process.env.DELYVA_SENDER_EMAIL ??
    (typeof adminEmail === "string" && adminEmail.length > 0 ? adminEmail : "support@example.com");

  const recipientName = structured.recipientName ?? "Recipient";
  const recipientPhone = structured.recipientPhone ?? "60100000000";
  const recipientEmail =
    structured.recipientEmail ??
    (typeof adminEmail === "string" && adminEmail.length > 0 ? adminEmail : senderEmail);

  const priceStr =
    order.total_amount !== null && Number.isFinite(order.total_amount)
      ? order.total_amount.toFixed(2)
      : "0.00";

  const inventoryItem = {
    name: "Order parcel",
    type: "PARCEL",
    price: { amount: priceStr, currency: "MYR" },
    weight: { value: weight.value, unit: "kg" },
    dimension: {
      unit: "cm",
      width: resolvedDimensions.width,
      length: resolvedDimensions.length,
      height: resolvedDimensions.height,
    },
    quantity: 1,
  };

  const base = new Date();
  const originScheduled = formatDelyvaScheduledMalaysia(new Date(base.getTime() + 60 * 60 * 1000));
  const destinationScheduled = formatDelyvaScheduledMalaysia(new Date(base.getTime() + 2 * 60 * 60 * 1000));

  const createPayload: Record<string, unknown> = {
    customerId,
    process: false,
    serviceCode,
    source: "asf-2-next",
    extId: order.id,
    referenceNo: order.id,
    note: `ASF order ${order.id}`,
    origin: {
      scheduledAt: originScheduled,
      inventory: [inventoryItem],
      contact: {
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        address1: originAddr.address1,
        address2: originAddr.address2,
        city: originAddr.city,
        state: originAddr.state,
        postcode: originAddr.postcode,
        country: originAddr.country,
      },
    },
    destination: {
      scheduledAt: destinationScheduled,
      inventory: [inventoryItem],
      contact: {
        name: recipientName,
        email: recipientEmail,
        phone: recipientPhone,
        address1: structured.address1,
        address2: structured.address2,
        city: structured.city,
        state: structured.state,
        postcode: structured.postcode,
        country: structured.country,
      },
    },
  };

  let created: unknown;
  try {
    created = await delyvaCreateOrder(createPayload);
  } catch (e) {
    console.error("create-shipment: delyvaCreateOrder", e);
    return NextResponse.json({ error: "Delyva rejected order creation" }, { status: 502 });
  }

  if (typeof created !== "object" || created === null) {
    return NextResponse.json({ error: "Invalid Delyva create response" }, { status: 502 });
  }
  const createdObj = created as Record<string, unknown>;
  const delyvaId = readDelyvaOrderId(createdObj.id);
  if (delyvaId === null) {
    return NextResponse.json({ error: "Delyva create response missing id" }, { status: 502 });
  }

  const processPayload: Record<string, unknown> = {
    serviceCode,
    originScheduledAt: originScheduled,
    destinationScheduledAt: destinationScheduled,
  };

  try {
    await delyvaProcessOrder(delyvaId, processPayload);
  } catch (e) {
    console.error("create-shipment: delyvaProcessOrder", e);
    return NextResponse.json({ error: "Delyva failed to process order" }, { status: 502 });
  }

  let details: unknown;
  try {
    details = await delyvaGetOrder(delyvaId);
  } catch (e) {
    console.error("create-shipment: delyvaGetOrder", e);
    return NextResponse.json({ error: "Delyva order details unavailable" }, { status: 502 });
  }

  let labelUrl: string;
  try {
    labelUrl = await delyvaGetLabelUrl(delyvaId);
  } catch (e) {
    console.error("create-shipment: delyvaGetLabelUrl", e);
    return NextResponse.json({ error: "Delyva label URL unavailable" }, { status: 502 });
  }

  let trackingNumber = "";
  let shippingRate: number | null = null;
  if (typeof details === "object" && details !== null) {
    const d = details as Record<string, unknown>;
    const consignment = readStringField(d, ["consignmentNo", "consignment_no"]);
    const tracking = readStringField(d, ["trackingNo", "tracking_no"]);
    trackingNumber = consignment ?? tracking ?? "";
    const priceBlock = d.price;
    if (typeof priceBlock === "object" && priceBlock !== null) {
      const pb = priceBlock as Record<string, unknown>;
      const amt = pb.amount;
      if (typeof amt === "number" && Number.isFinite(amt)) {
        shippingRate = amt;
      }
    }
  }

  const orderPatch: Database["public"]["Tables"]["orders"]["Update"] = {
    delyva_order_id: String(delyvaId),
    tracking_number: trackingNumber.length > 0 ? trackingNumber : null,
    courier_code: serviceCode,
    shipping_label_url: labelUrl,
    status: "awaiting_pickup",
  };
  if (shippingRate !== null) {
    orderPatch.shipping_rate = shippingRate;
  }

  const { error: updError } = await supabase.from("orders").update(orderPatch).eq("id", order.id);
  if (updError !== null) {
    console.error("create-shipment: order update", updError.message);
    return NextResponse.json({ error: "Failed to save shipment to database" }, { status: 500 });
  }

  return NextResponse.json({
    trackingNumber: trackingNumber.length > 0 ? trackingNumber : null,
    labelUrl,
  });
}
