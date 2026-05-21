import { NextResponse } from "next/server";

import { promotionIdParamSchema, promotionPatchBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { normalizePromoCode } from "@/app/api/_lib/promotions";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

type RouteParams = { params: { id: string } };

/**
 * GET /api/promotions/[id] — single promotion and linked product IDs.
 */
export async function GET(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = promotionIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const supabase = createServiceRoleClient();
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (promoError !== null) {
    console.error("GET /api/promotions/[id]", promoError.message);
    return NextResponse.json({ error: "Failed to load promotion" }, { status: 500 });
  }
  if (promotion === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: links, error: linkError } = await supabase
    .from("promotion_products")
    .select("product_id")
    .eq("promotion_id", id);

  if (linkError !== null) {
    console.error("GET /api/promotions/[id] links", linkError.message);
    return NextResponse.json({ error: "Failed to load promotion products" }, { status: 500 });
  }

  const productIds = (links ?? []).map((row) => row.product_id);
  return NextResponse.json({
    promotion: promotion as PromotionRow,
    productIds,
  });
}

/**
 * PATCH /api/promotions/[id] — update promotion and replace product links.
 */
export async function PATCH(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = promotionIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = promotionPatchBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const d = validated.data;
  const patch: Database["public"]["Tables"]["promotions"]["Update"] = {};

  if (d.name !== undefined) {
    patch.name = d.name;
  }

  if (d.description !== undefined) {
    if (d.description === null) {
      patch.description = null;
    } else {
      const t = d.description.trim();
      patch.description = t.length === 0 ? null : t;
    }
  }

  if (d.code !== undefined) {
    if (d.code === null) {
      patch.code = null;
    } else {
      const t = d.code.trim();
      patch.code = t.length === 0 ? null : normalizePromoCode(t);
    }
  }

  if (d.discount_type !== undefined) {
    patch.discount_type = d.discount_type;
  }

  if (d.discount_value !== undefined) {
    patch.discount_value = d.discount_value;
  }

  if (d.start_date !== undefined) {
    patch.start_date = d.start_date;
  }

  if (d.end_date !== undefined) {
    patch.end_date = d.end_date;
  }

  if (d.active !== undefined) {
    patch.active = d.active;
  }

  if (d.max_uses !== undefined) {
    patch.max_uses = d.max_uses;
  }

  const supabase = createServiceRoleClient();

  const { data: updated, error: updateError } = await supabase
    .from("promotions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError !== null || updated === null) {
    console.error("PATCH /api/promotions/[id]", updateError?.message);
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to update promotion" },
      { status: 400 }
    );
  }

  if (d.product_ids !== undefined) {
    const productIds = d.product_ids;

    const { error: delError } = await supabase
      .from("promotion_products")
      .delete()
      .eq("promotion_id", id);
    if (delError !== null) {
      console.error("PATCH promotion_products delete", delError.message);
      return NextResponse.json({ error: "Failed to update product links" }, { status: 500 });
    }

    if (productIds.length > 0) {
      const rows = productIds.map((product_id) => ({
        promotion_id: id,
        product_id,
      }));
      const { error: insError } = await supabase.from("promotion_products").insert(rows);
      if (insError !== null) {
        console.error("PATCH promotion_products insert", insError.message);
        return NextResponse.json({ error: "Failed to update product links" }, { status: 500 });
      }
    }
  }

  let productIdsOut: string[] = [];
  const { data: links } = await supabase
    .from("promotion_products")
    .select("product_id")
    .eq("promotion_id", id);
  productIdsOut = (links ?? []).map((row) => row.product_id);

  return NextResponse.json({
    promotion: updated as PromotionRow,
    productIds: productIdsOut,
  });
}

/**
 * DELETE /api/promotions/[id] — soft delete.
 */
export async function DELETE(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = promotionIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("promotions")
    .update({ deleted_at: nowIso })
    .eq("id", id);

  if (error !== null) {
    console.error("DELETE /api/promotions/[id]", error.message);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
