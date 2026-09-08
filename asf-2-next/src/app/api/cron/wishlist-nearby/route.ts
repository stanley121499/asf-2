/**
 * Cron job: wishlist nearby-stock matcher.
 *
 * POST /api/cron/wishlist-nearby
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron / manual invoke)
 *
 * Algorithm: plan §10 — fresh snapshots → pref on → wishlist ∩ stores ≤ 1.5 km
 * with `store_product_stock.count > 0` → 7-day cooldown → max 1 product / user / run.
 */

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { runWishlistNearbyMatcher } from "@/app/api/_lib/wishlistNearbyMatcher";

/**
 * Validates the shared cron secret from the Authorization header.
 *
 * @param request - Incoming cron request
 * @returns true when Bearer token matches `CRON_SECRET`
 */
function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (typeof secret !== "string" || secret.trim().length === 0) {
    console.error("wishlist-nearby cron: CRON_SECRET is not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (typeof authHeader !== "string") {
    return false;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match !== null ? match[1]?.trim() : undefined;
  if (typeof token !== "string" || token.length === 0) {
    return false;
  }

  return token === secret;
}

/**
 * POST /api/cron/wishlist-nearby — run the nearby wishlist stock matcher.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (authorizeCronRequest(request) === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "POST /api/cron/wishlist-nearby: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const startedAt = Date.now();
  const stats = await runWishlistNearbyMatcher(supabase);
  const durationMs = Date.now() - startedAt;

  console.info("wishlist-nearby cron completed", {
    durationMs,
    ...stats,
  });

  return NextResponse.json({
    ok: true,
    durationMs,
    stats,
  });
}

/**
 * GET is supported so Vercel Cron (which issues GET by default) can invoke the job.
 * Same secret gate as POST.
 */
export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}
