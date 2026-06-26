import { NextResponse } from "next/server";

import {
  storeLocationIdParamSchema,
  storeLocationPatchBodySchema,
} from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type StoreLocationRow = Database["public"]["Tables"]["store_locations"]["Row"];

type RouteParams = { params: { id: string } };

/**
 * Normalizes optional text fields to null when empty.
 */
function trimToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * GET /api/store-locations/[id] — single store location.
 */
export async function GET(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = storeLocationIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const supabase = createServiceRoleClient();
  const { data: storeLocation, error } = await supabase
    .from("store_locations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error !== null) {
    console.error("GET /api/store-locations/[id]", error.message);
    return NextResponse.json({ error: "Failed to load store location" }, { status: 500 });
  }
  if (storeLocation === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ storeLocation: storeLocation as StoreLocationRow });
}

/**
 * PATCH /api/store-locations/[id] — update store location.
 */
export async function PATCH(
  request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = storeLocationIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = storeLocationPatchBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const d = validated.data;
  const patch: Database["public"]["Tables"]["store_locations"]["Update"] = {};

  if (d.name !== undefined) {
    patch.name = d.name;
  }
  if (d.mall_name !== undefined) {
    patch.mall_name = d.mall_name;
  }
  if (d.address_line_1 !== undefined) {
    patch.address_line_1 = d.address_line_1;
  }
  if (d.address_line_2 !== undefined) {
    patch.address_line_2 = trimToNull(d.address_line_2);
  }
  if (d.city !== undefined) {
    patch.city = d.city;
  }
  if (d.state !== undefined) {
    patch.state = d.state;
  }
  if (d.postcode !== undefined) {
    patch.postcode = trimToNull(d.postcode);
  }
  if (d.country !== undefined) {
    patch.country = d.country;
  }
  if (d.phone !== undefined) {
    patch.phone = trimToNull(d.phone);
  }
  if (d.opening_hours !== undefined) {
    patch.opening_hours = trimToNull(d.opening_hours);
  }
  if (d.latitude !== undefined) {
    patch.latitude = d.latitude;
  }
  if (d.longitude !== undefined) {
    patch.longitude = d.longitude;
  }
  if (d.google_maps_url !== undefined) {
    patch.google_maps_url = d.google_maps_url ?? null;
  }
  if (d.waze_url !== undefined) {
    patch.waze_url = d.waze_url ?? null;
  }
  if (d.image_urls !== undefined) {
    patch.image_urls = d.image_urls;
  }
  if (d.sort_order !== undefined) {
    patch.sort_order = d.sort_order;
  }
  if (d.active !== undefined) {
    patch.active = d.active;
  }

  const supabase = createServiceRoleClient();
  const { data: updated, error: updateError } = await supabase
    .from("store_locations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError !== null || updated === null) {
    console.error("PATCH /api/store-locations/[id]", updateError?.message);
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to update store location" },
      { status: 400 }
    );
  }

  return NextResponse.json({ storeLocation: updated as StoreLocationRow });
}

/**
 * DELETE /api/store-locations/[id] — soft delete and deactivate.
 */
export async function DELETE(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const paramParsed = storeLocationIdParamSchema.safeParse({ id: context.params.id });
  if (paramParsed.success === false) {
    return validationErrorResponse(paramParsed.error);
  }
  const { id } = paramParsed.data;

  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("store_locations")
    .update({ deleted_at: nowIso, active: false })
    .eq("id", id);

  if (error !== null) {
    console.error("DELETE /api/store-locations/[id]", error.message);
    return NextResponse.json({ error: "Failed to delete store location" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
