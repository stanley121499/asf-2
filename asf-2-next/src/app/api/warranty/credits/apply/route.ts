import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { warrantyCreditApplyBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { validateWarrantyCreditForCart } from "@/app/api/_lib/warrantyCredits";

/**
 * POST /api/warranty/credits/apply — validate credit for cart (does not consume).
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

  const validated = warrantyCreditApplyBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { creditId, cartSubtotalMyr } = validated.data;
  const supabase = createServiceRoleClient();
  const result = await validateWarrantyCreditForCart(
    supabase,
    auth.user.id,
    creditId,
    cartSubtotalMyr
  );

  if (result.valid === false) {
    return NextResponse.json({ valid: false, reason: result.reason });
  }

  return NextResponse.json({
    valid: true,
    discountAmountMyr: result.discountAmountMyr,
    creditId: result.creditId,
  });
}
