import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { warrantyRedeemPreviewBodySchema } from "@/app/api/_lib/apiSchemas";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  previewWarrantyRedeem,
  warrantyErrorBody,
} from "@/app/api/_lib/warrantyRegistrations";

/**
 * POST /api/warranty/redeem/preview
 * Staff validates a voucher (redemption code or credit id) without burning it.
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

  const validated = warrantyRedeemPreviewBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const supabase = createServiceRoleClient();
  const result = await previewWarrantyRedeem(supabase, {
    redemptionCode: validated.data.redemptionCode,
    creditId: validated.data.creditId,
  });

  if (result.ok === false) {
    return NextResponse.json(warrantyErrorBody(result), { status: result.httpStatus });
  }

  return NextResponse.json({ preview: result.preview });
}
