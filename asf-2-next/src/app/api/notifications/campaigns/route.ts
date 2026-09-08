/**
 * Staff APIs for promotional notification campaigns.
 *
 * - GET  — recent campaign history
 * - POST — create a draft (`title_i18n`, `body_i18n`, `default_locale`, `deep_link`)
 *
 * Mutations use the service-role client after `requireStaffUser`.
 */

import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import { notificationCampaignCreateBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import type { Json, Tables, TablesInsert } from "@/database.types";

/** How many recent campaigns to return on list. */
const CAMPAIGN_LIST_LIMIT = 50;

type CampaignRow = Tables<"notification_campaigns">;

/**
 * GET /api/notifications/campaigns
 *
 * Staff-only list of recent `notification_campaigns` (newest first).
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
      "GET /api/notifications/campaigns: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("notification_campaigns")
    .select(
      "id, title_i18n, body_i18n, default_locale, deep_link, status, created_by, sent_at, recipient_count, error_summary, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(CAMPAIGN_LIST_LIMIT);

  if (error !== null) {
    console.error("GET /api/notifications/campaigns", error.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load campaigns" },
      { status: 500 }
    );
  }

  const campaigns: CampaignRow[] = data ?? [];
  return NextResponse.json({ campaigns });
}

/**
 * POST /api/notifications/campaigns
 *
 * Staff-only create of a promotional campaign in `draft` status.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = notificationCampaignCreateBodySchema.safeParse(
    parsedBody.data
  );
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const body = validated.data;

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "POST /api/notifications/campaigns: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const titleI18n: Json = {
    en: body.title_i18n.en.trim(),
    "zh-CN": body.title_i18n["zh-CN"].trim(),
    ms: body.title_i18n.ms.trim(),
  };
  const bodyI18n: Json = {
    en: body.body_i18n.en.trim(),
    "zh-CN": body.body_i18n["zh-CN"].trim(),
    ms: body.body_i18n.ms.trim(),
  };

  const insertRow: TablesInsert<"notification_campaigns"> = {
    title_i18n: titleI18n,
    body_i18n: bodyI18n,
    default_locale: body.default_locale,
    deep_link: body.deep_link,
    status: "draft",
    created_by: auth.user.id,
  };

  const { data, error } = await supabase
    .from("notification_campaigns")
    .insert(insertRow)
    .select(
      "id, title_i18n, body_i18n, default_locale, deep_link, status, created_by, sent_at, recipient_count, error_summary, created_at"
    )
    .single();

  if (error !== null || data === null) {
    console.error(
      "POST /api/notifications/campaigns insert",
      error?.message ?? "no row returned"
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not create campaign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, campaign: data }, { status: 201 });
}
