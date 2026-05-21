import { NextResponse } from "next/server";

import { promotionCreateBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { normalizePromoCode } from "@/app/api/_lib/promotions";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

/**
 * GET /api/promotions — list non-deleted promotions, newest first.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error !== null) {
    console.error("GET /api/promotions", error.message);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }

  return NextResponse.json({ promotions: (data ?? []) as PromotionRow[] });
}

/**
 * POST /api/promotions — create promotion and link products.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = promotionCreateBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const d = validated.data;

  let code: string | null = null;
  if (d.code !== undefined && d.code !== null) {
    const trimmed = d.code.trim();
    code = trimmed.length === 0 ? null : normalizePromoCode(trimmed);
  }

  let descriptionVal: string | null = null;
  if (d.description !== undefined) {
    if (d.description === null) {
      descriptionVal = null;
    } else {
      const t = d.description.trim();
      descriptionVal = t.length === 0 ? null : t;
    }
  }

  const startDateVal = d.start_date;
  const endDateVal = d.end_date;
  const active = d.active;
  const maxUses = d.max_uses === undefined ? null : d.max_uses;
  const productIds = d.product_ids ?? [];

  const supabase = createServiceRoleClient();

  const { data: inserted, error: insertError } = await supabase
    .from("promotions")
    .insert({
      name: d.name,
      description: descriptionVal,
      code,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      start_date: startDateVal,
      end_date: endDateVal,
      active,
      max_uses: maxUses,
      uses_count: 0,
    })
    .select("*")
    .single();

  if (insertError !== null || inserted === null) {
    console.error("POST /api/promotions insert", insertError?.message);
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create promotion" },
      { status: 400 }
    );
  }

  if (productIds.length > 0) {
    const rows = productIds.map((product_id) => ({
      promotion_id: inserted.id,
      product_id,
    }));
    const { error: linkError } = await supabase.from("promotion_products").insert(rows);
    if (linkError !== null) {
      console.error("POST /api/promotions promotion_products", linkError.message);
      await supabase.from("promotions").delete().eq("id", inserted.id);
      return NextResponse.json(
        { error: "Failed to link products to promotion" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ promotion: inserted as PromotionRow });
}
