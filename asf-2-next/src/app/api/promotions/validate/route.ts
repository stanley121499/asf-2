import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import {
  validatePromotionForCart,
  type PromotionCartLine,
} from "@/app/api/_lib/promotions";

/**
 * POST /api/promotions/validate
 *
 * Body: { code: string, cartLines: { product_id: string, amount: number }[] }
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const code = o["code"];
  const cartLinesRaw = o["cartLines"];

  if (typeof code !== "string") {
    return NextResponse.json({ error: "code must be a string" }, { status: 400 });
  }

  if (!Array.isArray(cartLinesRaw)) {
    return NextResponse.json(
      { error: "cartLines must be an array" },
      { status: 400 }
    );
  }

  const cartLines: PromotionCartLine[] = [];
  for (const item of cartLinesRaw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return NextResponse.json(
        { error: "Each cart line must be an object" },
        { status: 400 }
      );
    }
    const line = item as Record<string, unknown>;
    const productId = line["product_id"];
    const amount = line["amount"];
    if (typeof productId !== "string" || productId.length === 0) {
      return NextResponse.json(
        { error: "Each cart line needs a valid product_id" },
        { status: 400 }
      );
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Each cart line needs a positive numeric amount" },
        { status: 400 }
      );
    }
    cartLines.push({ product_id: productId, amount });
  }

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
