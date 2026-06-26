import { NextResponse } from "next/server";

import { storeLocationCreateBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type StoreLocationRow = Database["public"]["Tables"]["store_locations"]["Row"];

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
 * GET /api/store-locations — list non-deleted store locations for management.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("store_locations")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error !== null) {
    console.error("GET /api/store-locations", error.message);
    return NextResponse.json({ error: "Failed to load store locations" }, { status: 500 });
  }

  return NextResponse.json({ storeLocations: (data ?? []) as StoreLocationRow[] });
}

/**
 * POST /api/store-locations — create a store location.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = storeLocationCreateBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const d = validated.data;
  const supabase = createServiceRoleClient();

  const { data: inserted, error: insertError } = await supabase
    .from("store_locations")
    .insert({
      name: d.name,
      mall_name: d.mall_name,
      address_line_1: d.address_line_1,
      address_line_2: trimToNull(d.address_line_2),
      city: d.city,
      state: d.state,
      postcode: trimToNull(d.postcode),
      country: d.country,
      phone: trimToNull(d.phone),
      opening_hours: trimToNull(d.opening_hours),
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      google_maps_url: d.google_maps_url ?? null,
      waze_url: d.waze_url ?? null,
      image_urls: d.image_urls ?? [],
      sort_order: d.sort_order,
      active: d.active,
    })
    .select("*")
    .single();

  if (insertError !== null || inserted === null) {
    console.error("POST /api/store-locations insert", insertError?.message);
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create store location" },
      { status: 400 }
    );
  }

  return NextResponse.json({ storeLocation: inserted as StoreLocationRow });
}
