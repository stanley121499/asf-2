/**
 * Staff APIs for per-store product stock (store × product × color × size).
 *
 * - GET  — list stock rows for a product (joins store name / mall)
 * - PUT  — batch upsert counts; service-role write after staff auth
 *
 * Does not mutate global `product_stock`. Leaves `products.stock_place` /
 * `stock_code` alone (legacy free-text fields).
 */

import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import {
  storeProductStockQuerySchema,
  storeProductStockUpsertBodySchema,
} from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type StoreProductStockRow = Database["public"]["Tables"]["store_product_stock"]["Row"];
type StoreLocationRow = Database["public"]["Tables"]["store_locations"]["Row"];

/** API list item with store labels for the admin matrix. */
export type StoreProductStockListItem = {
  id: string;
  storeLocationId: string;
  storeName: string;
  mallName: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  count: number;
  updatedAt: string;
};

type StockWithStore = StoreProductStockRow & {
  store_locations:
    | Pick<StoreLocationRow, "id" | "name" | "mall_name" | "active" | "deleted_at">
    | null;
};

/**
 * Maps a DB row (+ optional store join) into the list DTO.
 */
function toListItem(row: StockWithStore): StoreProductStockListItem {
  const store = row.store_locations;
  return {
    id: row.id,
    storeLocationId: row.store_location_id,
    storeName: store?.name ?? "",
    mallName: store?.mall_name ?? "",
    productId: row.product_id,
    colorId: row.color_id,
    sizeId: row.size_id,
    count: row.count,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/store-product-stock?productId=<uuid>
 *
 * Staff-only list of `store_product_stock` for one product, with store labels.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const url = new URL(request.url);
  const validated = storeProductStockQuerySchema.safeParse({
    productId: url.searchParams.get("productId"),
  });
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { productId } = validated.data;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("store_product_stock")
    .select(
      "id, store_location_id, product_id, color_id, size_id, count, updated_at, store_locations(id, name, mall_name, active, deleted_at)"
    )
    .eq("product_id", productId)
    .order("updated_at", { ascending: false });

  if (error !== null) {
    console.error("GET /api/store-product-stock", error.message);
    return NextResponse.json({ error: "Failed to load store product stock" }, { status: 500 });
  }

  const rows = ((data ?? []) as StockWithStore[]).map(toListItem);
  return NextResponse.json({ rows });
}

/**
 * PUT /api/store-product-stock
 *
 * Staff-only batch upsert. Validates product, stores, and color/size FKs.
 * Unique key: `(store_location_id, product_id, color_id, size_id)` (NULLS NOT DISTINCT).
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = storeProductStockUpsertBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { productId, rows } = validated.data;
  const supabase = createServiceRoleClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (productError !== null) {
    console.error("PUT /api/store-product-stock product lookup", productError.message);
    return NextResponse.json({ error: "Failed to verify product" }, { status: 500 });
  }
  if (product === null) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ rows: [] as StoreProductStockListItem[] });
  }

  const storeIds = Array.from(new Set(rows.map((r) => r.storeLocationId)));
  const colorIds = Array.from(
    new Set(rows.map((r) => r.colorId).filter((id): id is string => id !== null))
  );
  const sizeIds = Array.from(
    new Set(rows.map((r) => r.sizeId).filter((id): id is string => id !== null))
  );

  const { data: stores, error: storesError } = await supabase
    .from("store_locations")
    .select("id")
    .in("id", storeIds)
    .eq("active", true)
    .is("deleted_at", null);

  if (storesError !== null) {
    console.error("PUT /api/store-product-stock stores lookup", storesError.message);
    return NextResponse.json({ error: "Failed to verify stores" }, { status: 500 });
  }
  const validStoreIds = new Set((stores ?? []).map((s) => s.id));
  for (const storeId of storeIds) {
    if (!validStoreIds.has(storeId)) {
      return NextResponse.json(
        { error: `Store location not found or inactive: ${storeId}` },
        { status: 400 }
      );
    }
  }

  if (colorIds.length > 0) {
    const { data: colors, error: colorsError } = await supabase
      .from("product_colors")
      .select("id")
      .eq("product_id", productId)
      .in("id", colorIds)
      .is("deleted_at", null);

    if (colorsError !== null) {
      console.error("PUT /api/store-product-stock colors lookup", colorsError.message);
      return NextResponse.json({ error: "Failed to verify colors" }, { status: 500 });
    }
    const validColorIds = new Set((colors ?? []).map((c) => c.id));
    for (const colorId of colorIds) {
      if (!validColorIds.has(colorId)) {
        return NextResponse.json(
          { error: `Color does not belong to product: ${colorId}` },
          { status: 400 }
        );
      }
    }
  }

  if (sizeIds.length > 0) {
    const { data: sizes, error: sizesError } = await supabase
      .from("product_sizes")
      .select("id")
      .eq("product_id", productId)
      .in("id", sizeIds)
      .is("deleted_at", null);

    if (sizesError !== null) {
      console.error("PUT /api/store-product-stock sizes lookup", sizesError.message);
      return NextResponse.json({ error: "Failed to verify sizes" }, { status: 500 });
    }
    const validSizeIds = new Set((sizes ?? []).map((s) => s.id));
    for (const sizeId of sizeIds) {
      if (!validSizeIds.has(sizeId)) {
        return NextResponse.json(
          { error: `Size does not belong to product: ${sizeId}` },
          { status: 400 }
        );
      }
    }
  }

  /**
   * Upsert one row at a time so NULL color_id / size_id match the
   * UNIQUE NULLS NOT DISTINCT constraint (PostgREST onConflict is unreliable with nulls).
   */
  const saved: StockWithStore[] = [];
  const nowIso = new Date().toISOString();

  for (const row of rows) {
    let existingQuery = supabase
      .from("store_product_stock")
      .select(
        "id, store_location_id, product_id, color_id, size_id, count, updated_at, store_locations(id, name, mall_name, active, deleted_at)"
      )
      .eq("store_location_id", row.storeLocationId)
      .eq("product_id", productId);

    existingQuery =
      row.colorId === null
        ? existingQuery.is("color_id", null)
        : existingQuery.eq("color_id", row.colorId);
    existingQuery =
      row.sizeId === null
        ? existingQuery.is("size_id", null)
        : existingQuery.eq("size_id", row.sizeId);

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

    if (existingError !== null) {
      console.error("PUT /api/store-product-stock existing lookup", existingError.message);
      return NextResponse.json({ error: "Failed to upsert store product stock" }, { status: 500 });
    }

    if (existing !== null) {
      const { data: updated, error: updateError } = await supabase
        .from("store_product_stock")
        .update({ count: row.count, updated_at: nowIso })
        .eq("id", existing.id)
        .select(
          "id, store_location_id, product_id, color_id, size_id, count, updated_at, store_locations(id, name, mall_name, active, deleted_at)"
        )
        .single();

      if (updateError !== null || updated === null) {
        console.error("PUT /api/store-product-stock update", updateError?.message);
        return NextResponse.json(
          { error: updateError?.message ?? "Failed to update store product stock" },
          { status: 400 }
        );
      }
      saved.push(updated as StockWithStore);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("store_product_stock")
        .insert({
          store_location_id: row.storeLocationId,
          product_id: productId,
          color_id: row.colorId,
          size_id: row.sizeId,
          count: row.count,
          updated_at: nowIso,
        })
        .select(
          "id, store_location_id, product_id, color_id, size_id, count, updated_at, store_locations(id, name, mall_name, active, deleted_at)"
        )
        .single();

      if (insertError !== null || inserted === null) {
        console.error("PUT /api/store-product-stock insert", insertError?.message);
        return NextResponse.json(
          { error: insertError?.message ?? "Failed to insert store product stock" },
          { status: 400 }
        );
      }
      saved.push(inserted as StockWithStore);
    }
  }

  const listRows = saved.map(toListItem);
  return NextResponse.json({ rows: listRows });
}
