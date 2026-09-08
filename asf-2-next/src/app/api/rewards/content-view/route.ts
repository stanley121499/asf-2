/**
 * Customer content-view award API — idempotent first-view discovery points.
 *
 * POST /api/rewards/content-view
 * Body: { contentType: "product" | "post" | "promo", contentId: uuid }
 * Auth: customer session (Bearer or cookie)
 *
 * Zero-points policy (locked): when `content_view_points` is 0, still INSERT
 * `content_view_awards` with `points_awarded = 0` so a later settings increase
 * cannot surprise-award the same content. `awarded` is true only when points > 0
 * (so Expo ceremony runs only when balance actually increases).
 */

import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import {
  contentViewAwardBodySchema,
  type ContentViewType,
} from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

/** Singleton row primary key for `rewards_settings`. */
const REWARDS_SETTINGS_ID = 1;

/** Postgres unique_violation — content already awarded for this user. */
const PG_UNIQUE_VIOLATION = "23505";

type ServiceClient = SupabaseClient<Database>;

/**
 * Maps content type to `user_points_logs.type` for admin readability.
 */
function pointsLogTypeForContent(contentType: ContentViewType): string {
  if (contentType === "product") {
    return "content_view_product";
  }
  if (contentType === "post") {
    return "content_view_post";
  }
  return "content_view_promo";
}

/**
 * Verifies the content row exists for the given type.
 *
 * @returns ok+exists, or ok:false on lookup failure
 */
async function contentExists(
  supabase: ServiceClient,
  contentType: ContentViewType,
  contentId: string
): Promise<{ ok: true; exists: boolean } | { ok: false }> {
  if (contentType === "product") {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("id", contentId)
      .maybeSingle();
    if (error !== null) {
      console.error("content-view product lookup", error.message);
      return { ok: false };
    }
    return { ok: true, exists: data !== null };
  }

  if (contentType === "post") {
    const { data, error } = await supabase
      .from("posts")
      .select("id")
      .eq("id", contentId)
      .maybeSingle();
    if (error !== null) {
      console.error("content-view post lookup", error.message);
      return { ok: false };
    }
    return { ok: true, exists: data !== null };
  }

  const { data, error } = await supabase
    .from("promotions")
    .select("id")
    .eq("id", contentId)
    .maybeSingle();
  if (error !== null) {
    console.error("content-view promo lookup", error.message);
    return { ok: false };
  }
  return { ok: true, exists: data !== null };
}

/**
 * Increments (or creates) `user_points` and appends a `user_points_logs` row.
 * Called only after a successful new award insert with points > 0.
 */
async function creditUserPoints(
  supabase: ServiceClient,
  userId: string,
  points: number,
  logType: string
): Promise<{ ok: true; balance: number } | { ok: false; message: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("user_points")
    .select("id, amount")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError !== null) {
    console.error("content-view user_points fetch", fetchError.message);
    return { ok: false, message: "Could not load user points" };
  }

  let pointRowId: string;
  let newBalance: number;

  if (existing === null) {
    const { data: created, error: createError } = await supabase
      .from("user_points")
      .insert({ user_id: userId, amount: points })
      .select("id, amount")
      .maybeSingle();

    if (createError !== null || created === null) {
      console.error(
        "content-view user_points create",
        createError?.message ?? "null row"
      );
      return { ok: false, message: "Could not create user points" };
    }
    pointRowId = created.id;
    newBalance = typeof created.amount === "number" ? created.amount : points;
  } else {
    const current =
      typeof existing.amount === "number" && Number.isFinite(existing.amount)
        ? existing.amount
        : 0;
    newBalance = current + points;
    const { data: updated, error: updateError } = await supabase
      .from("user_points")
      .update({ amount: newBalance })
      .eq("id", existing.id)
      .select("id, amount")
      .maybeSingle();

    if (updateError !== null || updated === null) {
      console.error(
        "content-view user_points update",
        updateError?.message ?? "null row"
      );
      return { ok: false, message: "Could not update user points" };
    }
    pointRowId = updated.id;
    newBalance =
      typeof updated.amount === "number" ? updated.amount : newBalance;
  }

  const { error: logError } = await supabase.from("user_points_logs").insert({
    point_id: pointRowId,
    amount: points,
    type: logType,
  });

  if (logError !== null) {
    console.error("content-view user_points_logs insert", logError.message);
    return { ok: false, message: "Could not log points transaction" };
  }

  return { ok: true, balance: newBalance };
}

/**
 * POST /api/rewards/content-view — idempotent first-view discovery award.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser(request);
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = contentViewAwardBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { contentType, contentId } = validated.data;
  const userId = auth.user.id;

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "POST /api/rewards/content-view: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const existence = await contentExists(supabase, contentType, contentId);
  if (existence.ok === false) {
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not verify content" },
      { status: 500 }
    );
  }
  if (existence.exists === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Content not found" },
      { status: 404 }
    );
  }

  const { data: settings, error: settingsError } = await supabase
    .from("rewards_settings")
    .select("content_view_points")
    .eq("id", REWARDS_SETTINGS_ID)
    .maybeSingle();

  if (settingsError !== null) {
    console.error("POST /api/rewards/content-view settings", settingsError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load rewards settings" },
      { status: 500 }
    );
  }

  const pointsToAward =
    settings !== null &&
    typeof settings.content_view_points === "number" &&
    Number.isFinite(settings.content_view_points)
      ? Math.max(0, Math.trunc(settings.content_view_points))
      : 1;

  const { data: inserted, error: insertError } = await supabase
    .from("content_view_awards")
    .insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      points_awarded: pointsToAward,
    })
    .select("id, points_awarded")
    .maybeSingle();

  if (insertError !== null) {
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json({
        awarded: false,
        points: 0,
        alreadyAwarded: true,
      });
    }
    console.error("POST /api/rewards/content-view insert", insertError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not record content view award" },
      { status: 500 }
    );
  }

  if (inserted === null) {
    return NextResponse.json({
      awarded: false,
      points: 0,
      alreadyAwarded: true,
    });
  }

  if (pointsToAward <= 0) {
    return NextResponse.json({
      awarded: false,
      points: 0,
      alreadyAwarded: false,
    });
  }

  const credit = await creditUserPoints(
    supabase,
    userId,
    pointsToAward,
    pointsLogTypeForContent(contentType)
  );

  if (credit.ok === false) {
    return NextResponse.json(
      { error: "INTERNAL", message: credit.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    awarded: true,
    points: pointsToAward,
    alreadyAwarded: false,
    balance: credit.balance,
  });
}
