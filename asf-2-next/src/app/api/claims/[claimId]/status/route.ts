import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { claimStatusChangeBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import type { TablesUpdate } from "@/database.types";
import { applyClaimStatusChange } from "@/modules/claims/claimStatusTransition";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { claimId: string } };

/**
 * POST /api/claims/[claimId]/status
 *
 * Staff claim status transition with audit log + customer notification.
 * Uses service role so `notifications` INSERT bypasses RLS.
 */
export async function POST(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const claimId = context.params.claimId;
  if (typeof claimId !== "string" || isUuid(claimId) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid claim id" },
      { status: 404 }
    );
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = claimStatusChangeBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const body = validated.data;
  const supabase = createServiceRoleClient();

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, user_id, status")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError !== null) {
    console.error("claim status: claim query", claimError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load claim" },
      { status: 500 }
    );
  }

  if (claim === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Claim not found" },
      { status: 404 }
    );
  }

  const updatePayload: TablesUpdate<"claims"> = {};
  if (body.staff_notes !== undefined) {
    updatePayload.staff_notes = body.staff_notes;
  }
  if (typeof body.approved_resolution === "string") {
    updatePayload.approved_resolution = body.approved_resolution;
  }
  if (typeof body.rejection_reason === "string") {
    updatePayload.rejection_reason = body.rejection_reason;
  }

  const ok = await applyClaimStatusChange({
    supabase,
    claimId: claim.id,
    userId: claim.user_id,
    oldStatus: claim.status,
    newStatus: body.newStatus,
    changedBy: auth.user.id,
    updatePayload:
      Object.keys(updatePayload).length > 0 ? updatePayload : undefined,
    notes: body.notes ?? null,
    notifyExtraBody: body.notifyExtraBody,
  });

  if (ok === false) {
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: "Failed to update claim status" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    claimId: claim.id,
    newStatus: body.newStatus,
  });
}
