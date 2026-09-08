/**
 * Staff API to send a promotional campaign draft to eligible customers.
 *
 * Audience (plan §10.2 / Agent 7):
 * - Users with ≥1 `push_tokens` where `app = 'customer'`
 * - AND (`notification_preferences.promotions` is true OR no prefs row)
 *
 * Per user: resolve title/body via preferred → default_locale → en → any
 * (`resolveLocalizedText`), then `createCustomerNotification` with
 * `type: "promotion"` and metadata `{ campaign_id, deep_link }`.
 *
 * Expo batching/throttle is handled inside `createCustomerNotification` →
 * `expoPush`; this route pages users and pauses briefly between pages.
 */

import { NextResponse } from "next/server";

import { requireStaffUser } from "@/app/api/_lib/apiAuth";
import {
  createCustomerNotification,
  resolveLocalizedText,
  type NotificationLocale,
} from "@/app/api/_lib/customerNotifications";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import type { Json, TablesUpdate } from "@/database.types";
import { isUuid } from "@/utils/uuid";

type RouteParams = { params: { id: string } };

/** Users processed per page while sending. */
const USER_PAGE_SIZE = 50;

/** Pause between user pages to stay comfortably under Expo 600/s. */
const PAGE_PAUSE_MS = 120;

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration to wait
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Parses campaign jsonb i18n into a locale → string map.
 *
 * @param value - Json column value (`title_i18n` / `body_i18n`)
 * @returns Flat string map (empty when shape is unexpected)
 */
function i18nJsonToRecord(value: Json): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      out[key] = entry;
    }
  }
  return out;
}

/**
 * Narrows a DB `default_locale` string to {@link NotificationLocale}.
 *
 * @param value - Stored default locale
 * @returns Supported locale, falling back to `en`
 */
function toNotificationLocale(value: string): NotificationLocale {
  if (value === "zh-CN" || value === "en" || value === "ms") {
    return value;
  }
  return "en";
}

/**
 * POST /api/notifications/campaigns/[id]/send
 *
 * Staff-only: mark draft as sending, notify eligible customers, update counts.
 */
export async function POST(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  const auth = await requireStaffUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const campaignId = context.params.id;
  if (typeof campaignId !== "string" || isUuid(campaignId) === false) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Invalid campaign id" },
      { status: 404 }
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    console.error(
      "POST /api/notifications/campaigns/[id]/send: service role",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data: campaign, error: loadError } = await supabase
    .from("notification_campaigns")
    .select(
      "id, title_i18n, body_i18n, default_locale, deep_link, status"
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (loadError !== null) {
    console.error(
      "campaign send: load",
      loadError.message
    );
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not load campaign" },
      { status: 500 }
    );
  }

  if (campaign === null) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.status !== "draft" && campaign.status !== "failed") {
    return NextResponse.json(
      {
        error: "CONFLICT",
        message: `Campaign cannot be sent from status "${campaign.status}"`,
      },
      { status: 409 }
    );
  }

  const titleI18n = i18nJsonToRecord(campaign.title_i18n);
  const bodyI18n = i18nJsonToRecord(campaign.body_i18n);
  const defaultLocale = toNotificationLocale(campaign.default_locale);

  const defaultTitle = resolveLocalizedText(titleI18n, null, defaultLocale);
  const defaultBody = resolveLocalizedText(bodyI18n, null, defaultLocale);
  if (defaultTitle.trim().length === 0 || defaultBody.trim().length === 0) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        message: "Campaign needs non-empty title and body for the default locale fallback chain",
      },
      { status: 400 }
    );
  }

  const sendingUpdate: TablesUpdate<"notification_campaigns"> = {
    status: "sending",
    error_summary: null,
  };
  const { error: sendingError } = await supabase
    .from("notification_campaigns")
    .update(sendingUpdate)
    .eq("id", campaignId);

  if (sendingError !== null) {
    console.error("campaign send: status→sending", sendingError.message);
    return NextResponse.json(
      { error: "INTERNAL", message: "Could not start campaign send" },
      { status: 500 }
    );
  }

  let recipientCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const errorSamples: string[] = [];
  /** Dedupes users who appear on multiple token-row pages (multi-platform). */
  const seenUserIds = new Set<string>();

  /**
   * Appends a short error sample for the campaign `error_summary`.
   *
   * @param message - Error detail
   */
  const noteError = (message: string): void => {
    failCount += 1;
    if (errorSamples.length < 5) {
      errorSamples.push(message);
    }
  };

  let pageOffset = 0;
  let hasMoreTokenPages = true;

  while (hasMoreTokenPages) {
    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("user_id")
      .eq("app", "customer")
      .order("user_id", { ascending: true })
      .range(pageOffset, pageOffset + USER_PAGE_SIZE - 1);

    if (tokenError !== null) {
      console.error("campaign send: push_tokens page", tokenError.message);
      noteError(`push_tokens query: ${tokenError.message}`);
      break;
    }

    const rows = tokenRows ?? [];
    if (rows.length < USER_PAGE_SIZE) {
      hasMoreTokenPages = false;
    }
    pageOffset += USER_PAGE_SIZE;

    if (rows.length === 0) {
      break;
    }

    const userIds: string[] = [];
    for (const row of rows) {
      if (typeof row.user_id !== "string" || row.user_id.length === 0) {
        continue;
      }
      if (seenUserIds.has(row.user_id)) {
        continue;
      }
      seenUserIds.add(row.user_id);
      userIds.push(row.user_id);
    }
    if (userIds.length === 0) {
      continue;
    }

    const { data: prefsRows, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, promotions")
      .in("user_id", userIds);

    if (prefsError !== null) {
      console.error("campaign send: prefs page", prefsError.message);
      noteError(`prefs query: ${prefsError.message}`);
      continue;
    }

    const prefsByUser = new Map<string, boolean>();
    for (const row of prefsRows ?? []) {
      prefsByUser.set(row.user_id, row.promotions);
    }

    // Eligible: promotions true OR no prefs row (defaults to allow promotions).
    const eligibleIds = userIds.filter((userId) => {
      const pref = prefsByUser.get(userId);
      return pref === undefined || pref === true;
    });

    if (eligibleIds.length === 0) {
      continue;
    }

    const { data: detailsRows, error: detailsError } = await supabase
      .from("user_details")
      .select("id, preferred_locale")
      .in("id", eligibleIds);

    if (detailsError !== null) {
      console.error("campaign send: user_details page", detailsError.message);
      noteError(`user_details query: ${detailsError.message}`);
    }

    const localeByUser = new Map<string, string | null>();
    for (const row of detailsRows ?? []) {
      const preferred =
        typeof row.preferred_locale === "string" ? row.preferred_locale : null;
      localeByUser.set(row.id, preferred);
    }

    for (const userId of eligibleIds) {
      const preferredLocale = localeByUser.get(userId) ?? null;
      const resolvedTitle = resolveLocalizedText(
        titleI18n,
        preferredLocale,
        defaultLocale
      );
      const resolvedBody = resolveLocalizedText(
        bodyI18n,
        preferredLocale,
        defaultLocale
      );

      if (
        resolvedTitle.trim().length === 0 ||
        resolvedBody.trim().length === 0
      ) {
        noteError(`empty copy for user ${userId}`);
        continue;
      }

      const metadata: Json = {
        campaign_id: campaignId,
        ...(typeof campaign.deep_link === "string" &&
        campaign.deep_link.length > 0
          ? { deep_link: campaign.deep_link }
          : {}),
      };

      try {
        const result = await createCustomerNotification({
          supabase,
          userId,
          type: "promotion",
          resolvedTitle,
          resolvedBody,
          defaultLocale,
          metadata,
        });

        if (result.skipped) {
          // Prefs flipped off between audience filter and helper — treat as excluded.
          skippedCount += 1;
          continue;
        }
        if (result.notificationId === null) {
          noteError(`notify failed for user ${userId}`);
          continue;
        }
        recipientCount += 1;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "unknown notify error";
        console.error("campaign send: notify", userId, message);
        noteError(`notify exception for user ${userId}: ${message}`);
      }
    }

    if (hasMoreTokenPages) {
      await sleep(PAGE_PAUSE_MS);
    }
  }

  const sentAt = new Date().toISOString();
  const errorSummaryParts: string[] = [];
  if (failCount > 0) {
    errorSummaryParts.push(`${failCount} failures`);
    if (errorSamples.length > 0) {
      errorSummaryParts.push(errorSamples.join("; "));
    }
  }
  if (skippedCount > 0) {
    errorSummaryParts.push(`${skippedCount} skipped by prefs`);
  }

  const finalStatus =
    failCount > 0 && recipientCount === 0 ? "failed" : "sent";

  const finalUpdate: TablesUpdate<"notification_campaigns"> = {
    status: finalStatus,
    sent_at: sentAt,
    recipient_count: recipientCount,
    error_summary:
      errorSummaryParts.length > 0 ? errorSummaryParts.join(" — ") : null,
  };

  const { data: updated, error: finalError } = await supabase
    .from("notification_campaigns")
    .update(finalUpdate)
    .eq("id", campaignId)
    .select(
      "id, title_i18n, body_i18n, default_locale, deep_link, status, created_by, sent_at, recipient_count, error_summary, created_at"
    )
    .single();

  if (finalError !== null || updated === null) {
    console.error(
      "campaign send: final update",
      finalError?.message ?? "no row"
    );
    return NextResponse.json(
      {
        error: "INTERNAL",
        message: "Send finished but could not update campaign row",
        recipientCount,
        failCount,
        skippedCount,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    campaign: updated,
    recipientCount,
    failCount,
    skippedCount,
  });
}
