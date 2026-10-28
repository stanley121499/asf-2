import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { notifyClaimSubmitted } from "@/modules/claims/claimNotifications";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { claimId: string } };

/**
 * POST /api/claims/[claimId]/notify-submitted
 *
 * Thin server helper: inserts `claim_created` via service role after the
 * customer creates a claim client-side (RLS blocks browser INSERTs on
 * `notifications`). Caller must own the claim.
 */
export async function POST(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser(request);
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

  const supabase = createServiceRoleClient();
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, user_id")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError !== null) {
    console.error("notify-submitted: claim query", claimError.message);
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

  if (claim.user_id !== auth.user.id) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Claim does not belong to this account" },
      { status: 403 }
    );
  }

  await notifyClaimSubmitted(supabase, {
    userId: claim.user_id,
    claimId: claim.id,
  });

  return NextResponse.json({ ok: true });
}
