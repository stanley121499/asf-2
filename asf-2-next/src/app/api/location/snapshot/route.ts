/**
 * Customer location snapshot API — upsert latest lat/lng for nearby matching.
 *
 * POST /api/location/snapshot
 * Body: { latitude, longitude, accuracyM? }
 * Auth: customer session (Bearer or cookie)
 *
 * Writes one row per user (`user_location_snapshots.user_id` PK).
 */

import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { locationSnapshotBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

/**
 * POST /api/location/snapshot — upsert the caller's latest coordinates.
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

  const validated = locationSnapshotBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const { latitude, longitude, accuracyM } = validated.data;
  const userId = auth.user.id;
  const recordedAt = new Date().toISOString();

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "POST /api/location/snapshot: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { error: upsertError } = await supabase
    .from("user_location_snapshots")
    .upsert(
      {
        user_id: userId,
        latitude,
        longitude,
        accuracy_m: accuracyM ?? null,
        recorded_at: recordedAt,
      },
      { onConflict: "user_id" }
    );

  if (upsertError !== null) {
    console.error("POST /api/location/snapshot upsert", upsertError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not save location snapshot" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    recordedAt,
  });
}
