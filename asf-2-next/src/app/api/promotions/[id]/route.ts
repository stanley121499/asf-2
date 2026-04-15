import { NextResponse } from "next/server";

import { normalizePromoCode } from "@/app/api/_lib/promotions";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { isUuid } from "@/app/api/_lib/validation";

import type { Database } from "@/database.types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

function isDiscountType(value: unknown): value is "percentage" | "fixed" {
  return value === "percentage" || value === "fixed";
}

type RouteParams = { params: { id: string } };

/**
 * GET /api/promotions/[id] — single promotion and linked product IDs.
 */
export async function GET(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const { id } = context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
  const { id } = context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
  const patch: Database["public"]["Tables"]["promotions"]["Update"] = {};

  if (o["name"] !== undefined) {
    if (typeof o["name"] !== "string" || o["name"].trim().length === 0) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    patch.name = o["name"].trim();
  }

  if (o["description"] !== undefined) {
    if (o["description"] === null) {
      patch.description = null;
    } else if (typeof o["description"] === "string") {
      patch.description =
        o["description"].trim().length === 0 ? null : o["description"].trim();
    } else {
      return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
    }
  }

  if (o["code"] !== undefined) {
    if (o["code"] === null) {
      patch.code = null;
    } else if (typeof o["code"] === "string") {
      const t = o["code"].trim();
      patch.code = t.length === 0 ? null : normalizePromoCode(t);
    } else {
      return NextResponse.json({ error: "code must be a string or null" }, { status: 400 });
    }
  }

  if (o["discount_type"] !== undefined) {
    if (!isDiscountType(o["discount_type"])) {
      return NextResponse.json(
        { error: "discount_type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }
    patch.discount_type = o["discount_type"];
  }

  if (o["discount_value"] !== undefined) {
    const v =
      typeof o["discount_value"] === "number"
        ? o["discount_value"]
        : typeof o["discount_value"] === "string"
          ? Number(o["discount_value"])
          : NaN;
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { error: "discount_value must be a non-negative number" },
        { status: 400 }
      );
    }
    patch.discount_value = v;
  }

  if (o["start_date"] !== undefined) {
    if (o["start_date"] === null) {
      patch.start_date = null;
    } else if (typeof o["start_date"] === "string") {
      patch.start_date = o["start_date"].length === 0 ? null : o["start_date"];
    } else {
      return NextResponse.json({ error: "start_date invalid" }, { status: 400 });
    }
  }

  if (o["end_date"] !== undefined) {
    if (o["end_date"] === null) {
      patch.end_date = null;
    } else if (typeof o["end_date"] === "string") {
      patch.end_date = o["end_date"].length === 0 ? null : o["end_date"];
    } else {
      return NextResponse.json({ error: "end_date invalid" }, { status: 400 });
    }
  }

  if (o["active"] !== undefined) {
    if (typeof o["active"] !== "boolean") {
      return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
    }
    patch.active = o["active"];
  }

  if (o["max_uses"] !== undefined) {
    if (o["max_uses"] === null) {
      patch.max_uses = null;
    } else if (
      typeof o["max_uses"] === "number" &&
      Number.isInteger(o["max_uses"]) &&
      o["max_uses"] > 0
    ) {
      patch.max_uses = o["max_uses"];
    } else {
      return NextResponse.json(
        { error: "max_uses must be a positive integer or null" },
        { status: 400 }
      );
    }
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

  if (o["product_ids"] !== undefined) {
    if (!Array.isArray(o["product_ids"])) {
      return NextResponse.json({ error: "product_ids must be an array" }, { status: 400 });
    }
    const productIds: string[] = [];
    for (const pid of o["product_ids"]) {
      if (typeof pid !== "string" || !isUuid(pid)) {
        return NextResponse.json(
          { error: "Each product_ids entry must be a UUID string" },
          { status: 400 }
        );
      }
      productIds.push(pid);
    }

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
  const { id } = context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
