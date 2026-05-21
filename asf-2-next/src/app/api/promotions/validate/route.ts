import { NextResponse } from "next/server";

import { promotionValidateBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { getClientIp, getPromotionValidateRateLimiter } from "@/app/api/_lib/rateLimit";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { validatePromotionForCart } from "@/app/api/_lib/promotions";

/**
 * POST /api/promotions/validate
 *
 * Body: { code: string, cartLines: { product_id: string, amount: number }[] }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const limiter = getPromotionValidateRateLimiter();
  const limited = await limiter(ip);
  if (limited.ok === false) {
    return limited.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = promotionValidateBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { code, cartLines } = validated.data;

  const supabase = createServiceRoleClient();
  const result = await validatePromotionForCart(supabase, code, cartLines);

  if (result.valid === false) {
    return NextResponse.json({ valid: false, reason: result.reason });
  }

  return NextResponse.json({
    valid: true,
    promotionId: result.promotionId,
    discountType: result.discountType,
    discountValue: result.discountValue,
    discountAmountMyr: result.discountAmountMyr,
  });
}
