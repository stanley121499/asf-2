import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  getWarrantyVoucherForUser,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { id: string } };

/**
 * GET /api/warranty/credits/[id]/voucher
 * Own voucher payload for QR / backup-code display.
 */
export async function GET(
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
      { error: "CREDIT_NOT_FOUND", message: "Invalid credit id" },
      { status: 404 }
    );
  }

  const supabase = createServiceRoleClient();
  const result = await getWarrantyVoucherForUser(supabase, auth.user.id, id);

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ voucher: result.voucher });
}
