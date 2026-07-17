import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  claimWarrantyRegistration,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { id: string } };

/**
 * POST /api/warranty/registrations/[id]/claim
 * One-time auto-issue of a fixed-RM warranty credit at the current tier.
 * No staff approval. Server computes amount — never trusts client percent/amount.
 */
export async function POST(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const id = context.params.id;
  if (typeof id !== "string" || isUuid(id) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid registration id" },
      { status: 404 }
    );
  }

  const supabase = createServiceRoleClient();
  const result = await claimWarrantyRegistration(supabase, {
    userId: auth.user.id,
    registrationId: id,
  });

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({
    registration: result.registration,
    credit: result.credit,
  });
}
