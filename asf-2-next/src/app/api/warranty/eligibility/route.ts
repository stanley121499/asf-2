import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { warrantyEligibilityBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { evaluateWarrantyCreditEstimate } from "@/modules/claims/claimEligibility";

/**
 * POST /api/warranty/eligibility — batch estimate for order items.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = warrantyEligibilityBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { orderId, orderItemIds, claimTypeKey } = validated.data;
  const supabase = createServiceRoleClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError !== null) {
    console.error("POST /api/warranty/eligibility order", orderError.message);
    return NextResponse.json({ error: "Could not load order" }, { status: 500 });
  }

  if (order === null) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await Promise.all(
    orderItemIds.map((orderItemId) =>
      evaluateWarrantyCreditEstimate(supabase, claimTypeKey, orderId, orderItemId)
    )
  );

  return NextResponse.json({ items });
}
