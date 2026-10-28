import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { orderStatusChangeBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { notifyOrderStatusChanged } from "@/app/api/_lib/orderNotifications";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import type { TablesInsert } from "@/database.types";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { orderId: string } };

/**
 * POST /api/orders/[orderId]/status
 *
 * Staff order status transition with `order_status_logs` audit row and
 * `order_status_changed` customer notification (service role bypasses RLS).
 *
 * Request body: `{ "newStatus": "pending" | "processing" | "shipped" | "completed" | "cancelled" }`
 *
 * Response: `{ ok, orderId, oldStatus, newStatus, statusLog }`
 */
export async function POST(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const orderId = context.params.orderId;
  if (typeof orderId !== "string" || isUuid(orderId) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid order id" },
      { status: 404 }
    );
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = orderStatusChangeBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { newStatus } = validated.data;
  const supabase = createServiceRoleClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError !== null) {
    console.error("order status: order query", orderError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load order" },
      { status: 500 }
    );
  }

  if (order === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Order not found" },
      { status: 404 }
    );
  }

  const oldStatus = order.status;

  if (oldStatus === newStatus) {
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      oldStatus,
      newStatus,
      statusLog: null,
      unchanged: true,
    });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", order.id);

  if (updateError !== null) {
    console.error("order status: update", updateError.message);
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: "Failed to update order status" },
      { status: 400 }
    );
  }

  const statusLogInsert: TablesInsert<"order_status_logs"> = {
    order_id: order.id,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: auth.user.id,
  };

  const { data: statusLog, error: logError } = await supabase
    .from("order_status_logs")
    .insert(statusLogInsert)
    .select("id, old_status, new_status, changed_by, created_at")
    .single();

  if (logError !== null) {
    console.error("order status: order_status_logs", logError.message);
  }

  if (typeof order.user_id === "string" && order.user_id.length > 0) {
    try {
      await notifyOrderStatusChanged(supabase, {
        userId: order.user_id,
        orderId: order.id,
        oldStatus,
        newStatus,
      });
    } catch (notifyError) {
      console.error("order status: notify", notifyError);
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    oldStatus,
    newStatus,
    statusLog: statusLog ?? null,
  });
}
