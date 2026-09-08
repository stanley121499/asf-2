/**
 * Staff rewards settings API — read/update singleton `rewards_settings`.
 *
 * GET  /api/rewards/settings  → { content_view_points }
 * PATCH /api/rewards/settings → body { content_view_points } (integer ≥ 0)
 */

import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { rewardsSettingsPatchBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

/** Singleton row primary key for `rewards_settings`. */
const REWARDS_SETTINGS_ID = 1;

/**
 * GET /api/rewards/settings — staff read of discovery-point amount.
 */
export async function GET(): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "GET /api/rewards/settings: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("rewards_settings")
    .select("content_view_points")
    .eq("id", REWARDS_SETTINGS_ID)
    .maybeSingle();

  if (error !== null) {
    console.error("GET /api/rewards/settings", error.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load rewards settings" },
      { status: 500 }
    );
  }

  if (data === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Rewards settings row missing" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    content_view_points: data.content_view_points,
  });
}

/**
 * PATCH /api/rewards/settings — staff update of `content_view_points`.
 * Affects future awards only; past `content_view_awards` rows stay as logged.
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = rewardsSettingsPatchBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "PATCH /api/rewards/settings: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { content_view_points: contentViewPoints } = validated.data;
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("rewards_settings")
    .update({
      content_view_points: contentViewPoints,
      updated_at: nowIso,
      updated_by: auth.user.id,
    })
    .eq("id", REWARDS_SETTINGS_ID)
    .select("content_view_points")
    .maybeSingle();

  if (error !== null) {
    console.error("PATCH /api/rewards/settings", error.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not update rewards settings" },
      { status: 500 }
    );
  }

  if (data === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Rewards settings row missing" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    content_view_points: data.content_view_points,
  });
}
