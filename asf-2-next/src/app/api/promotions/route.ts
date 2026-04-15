import { NextResponse } from "next/server";

import { normalizePromoCode } from "@/app/api/_lib/promotions";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { isUuid } from "@/app/api/_lib/validation";

import type { Database } from "@/database.types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

function isDiscountType(value: unknown): value is "percentage" | "fixed" {
  return value === "percentage" || value === "fixed";
}

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

interface CreateBody {
  name?: unknown;
  description?: unknown;
  code?: unknown;
  discount_type?: unknown;
  discount_value?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  active?: unknown;
  max_uses?: unknown;
  product_ids?: unknown;
}

/**
 * POST /api/promotions — create promotion and link products.
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

  const o = body as CreateBody;
  const name = o.name;
  const description = o.description;
  const codeRaw = o.code;
  const discountType = o.discount_type;
  const discountValueRaw = o.discount_value;
  const startDate = o.start_date;
  const endDate = o.end_date;
  const activeRaw = o.active;
  const maxUsesRaw = o.max_uses;
  const productIdsRaw = o.product_ids;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!isDiscountType(discountType)) {
    return NextResponse.json(
      { error: "discount_type must be 'percentage' or 'fixed'" },
      { status: 400 }
    );
  }
  const discountValue =
    typeof discountValueRaw === "number"
      ? discountValueRaw
      : typeof discountValueRaw === "string"
        ? Number(discountValueRaw)
        : NaN;
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return NextResponse.json(
      { error: "discount_value must be a non-negative number" },
      { status: 400 }
    );
  }

  let code: string | null = null;
  if (codeRaw !== undefined && codeRaw !== null) {
    if (typeof codeRaw !== "string") {
      return NextResponse.json({ error: "code must be a string or null" }, { status: 400 });
    }
    const trimmed = codeRaw.trim();
    code = trimmed.length === 0 ? null : normalizePromoCode(trimmed);
  }

  const active =
    typeof activeRaw === "boolean" ? activeRaw : activeRaw === undefined ? true : null;
  if (active === null) {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }

  let descriptionVal: string | null = null;
  if (typeof description === "string") {
    descriptionVal = description.trim().length === 0 ? null : description.trim();
  } else if (description !== undefined && description !== null) {
    return NextResponse.json({ error: "description must be a string" }, { status: 400 });
  }

  let startDateVal: string | null = null;
  if (startDate === null || startDate === undefined) {
    startDateVal = null;
  } else if (typeof startDate === "string" && startDate.length > 0) {
    startDateVal = startDate;
  } else {
    return NextResponse.json({ error: "start_date must be a string or null" }, { status: 400 });
  }

  let endDateVal: string | null = null;
  if (endDate === null || endDate === undefined) {
    endDateVal = null;
  } else if (typeof endDate === "string" && endDate.length > 0) {
    endDateVal = endDate;
  } else {
    return NextResponse.json({ error: "end_date must be a string or null" }, { status: 400 });
  }

  let maxUses: number | null = null;
  if (maxUsesRaw === null || maxUsesRaw === undefined) {
    maxUses = null;
  } else if (typeof maxUsesRaw === "number" && Number.isInteger(maxUsesRaw) && maxUsesRaw > 0) {
    maxUses = maxUsesRaw;
  } else {
    return NextResponse.json(
      { error: "max_uses must be a positive integer or null" },
      { status: 400 }
    );
  }

  const productIds: string[] = [];
  if (productIdsRaw !== undefined) {
    if (!Array.isArray(productIdsRaw)) {
      return NextResponse.json({ error: "product_ids must be an array" }, { status: 400 });
    }
    for (const id of productIdsRaw) {
      if (typeof id !== "string" || !isUuid(id)) {
        return NextResponse.json(
          { error: "Each product_ids entry must be a UUID string" },
          { status: 400 }
        );
      }
      productIds.push(id);
    }
  }

  const supabase = createServiceRoleClient();

  const { data: inserted, error: insertError } = await supabase
    .from("promotions")
    .insert({
      name: name.trim(),
      description: descriptionVal,
      code,
      discount_type: discountType,
      discount_value: discountValue,
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
