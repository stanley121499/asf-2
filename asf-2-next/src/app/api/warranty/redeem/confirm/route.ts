import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { warrantyRedeemConfirmBodySchema } from "@/app/api/_lib/apiSchemas";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  confirmWarrantyRedeemInStore,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";

/**
 * POST /api/warranty/redeem/confirm
 * Staff burns an active voucher in-store (single-use).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = warrantyRedeemConfirmBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const supabase = createServiceRoleClient();
  const result = await confirmWarrantyRedeemInStore(supabase, {
    staffUserId: auth.user.id,
    redemptionCode: validated.data.redemptionCode,
    redeemedStoreId: validated.data.redeemedStoreId,
  });

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ voucher: result.voucher });
}
