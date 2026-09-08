/**
 * Shared server helper for customer inbox + Expo push notifications.
 *
 * Flow (plan §9 + nearby engagement 2026-09-08):
 * 1. Load prefs (defaults if missing)
 * 2. Map type → category (`orders` | `claims` | `promotions` | `nearby_stock`)
 * 3. Promotions / nearby_stock off → skip all (no inbox row, no push)
 * 4. Resolve locale from `user_details.preferred_locale`
 * 5. Resolve copy from templates (or caller-provided title/body); interpolate `{{var}}`
 * 6. INSERT `notifications`
 * 7. Orders/claims push flag false → return after insert (inbox only)
 * 8. Else load `push_tokens` (`app = customer`) and send via Expo Push
 *
 * Do not import this module into client bundles. Pass a service-role
 * Supabase client from trusted Route Handlers only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, TablesInsert } from "@/database.types";
import { sendExpoPushToTokens } from "@/app/api/_lib/expoPush";
import { interpolateTemplate } from "@/app/api/_lib/notificationTemplateVars";

export { interpolateTemplate } from "@/app/api/_lib/notificationTemplateVars";

type ServiceClient = SupabaseClient<Database>;

/** Supported notification locales (matches DB CHECK + seed). */
export type NotificationLocale = "zh-CN" | "en" | "ms";

/**
 * Preference category that gates inbox and/or push.
 * `nearby_stock` is independent of `claims` — do not fold wishlist nearby into claims.
 */
export type NotificationPrefCategory =
  | "orders"
  | "claims"
  | "promotions"
  | "nearby_stock";

const SUPPORTED_LOCALES: ReadonlySet<string> = new Set(["zh-CN", "en", "ms"]);

const DEFAULT_PREFS = {
  orders_push: true,
  claims_push: true,
  promotions: true,
  nearby_stock_push: true,
} as const;

/** Params for {@link createCustomerNotification}. */
export type CreateCustomerNotificationParams = {
  /** Service-role (or otherwise privileged) Supabase client. */
  supabase: ServiceClient;
  userId: string;
  /** Template / notification type key, e.g. `order_confirmed`. */
  type: string;
  /** Whitelisted `{{var}}` substitutions for templates. */
  vars?: Record<string, string>;
  /** Stored on the inbox row and forwarded in the push `data` payload. */
  metadata?: Json;
  /** When set with `resolvedBody`, skips template load (promotions / one-offs). */
  resolvedTitle?: string;
  resolvedBody?: string;
  /** Fallback locale when `preferred_locale` is null (default `en`). */
  defaultLocale?: NotificationLocale;
};

/** Result of {@link createCustomerNotification}. */
export type CreateCustomerNotificationResult = {
  notificationId: string | null;
  pushed: boolean;
  /** True when prefs blocked delivery entirely (e.g. promotions off). */
  skipped: boolean;
};

type TemplateRow = {
  locale: string;
  title_template: string;
  body_template: string;
};

/**
 * Maps a notification `type` to its preference category.
 *
 * @param type - Notification type string
 * @returns Pref category used for gating
 */
export function categoryForNotificationType(type: string): NotificationPrefCategory {
  if (type === "wishlist_nearby_stock") {
    return "nearby_stock";
  }
  if (type === "promotion") {
    return "promotions";
  }
  if (
    type.startsWith("order_") ||
    type === "payment_failed"
  ) {
    return "orders";
  }
  // claim_*, warranty_*, ticket_*, and any future claims-family types
  return "claims";
}

/**
 * Picks the best non-empty string from an i18n map (campaigns / resolved maps).
 *
 * Locale order (plan §8): preferred → defaultLocale → `en` → any non-empty.
 *
 * @param i18n - Map of locale → text
 * @param preferredLocale - User preferred locale, or null
 * @param defaultLocale - Campaign/template default locale
 * @returns Resolved text, or empty string if nothing usable
 */
export function resolveLocalizedText(
  i18n: Record<string, string>,
  preferredLocale: string | null | undefined,
  defaultLocale: NotificationLocale = "en"
): string {
  const candidates: string[] = [];

  if (
    typeof preferredLocale === "string" &&
    SUPPORTED_LOCALES.has(preferredLocale)
  ) {
    candidates.push(preferredLocale);
  }
  candidates.push(defaultLocale);
  if (defaultLocale !== "en") {
    candidates.push("en");
  }

  const seen = new Set<string>();
  for (const locale of candidates) {
    if (seen.has(locale)) {
      continue;
    }
    seen.add(locale);
    const text = i18n[locale];
    if (typeof text === "string" && text.trim().length > 0) {
      return text;
    }
  }

  for (const value of Object.values(i18n)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

/**
 * Chooses a template row using the same locale fallback chain as §8.
 *
 * @param rows - All locale rows for one notification type
 * @param preferredLocale - User preferred locale
 * @param defaultLocale - Fallback default
 * @returns Matching row, or `null` if none have content
 */
function pickTemplateRow(
  rows: TemplateRow[],
  preferredLocale: string | null,
  defaultLocale: NotificationLocale
): TemplateRow | null {
  const byLocale = new Map<string, TemplateRow>();
  for (const row of rows) {
    byLocale.set(row.locale, row);
  }

  const candidates: string[] = [];
  if (
    preferredLocale !== null &&
    SUPPORTED_LOCALES.has(preferredLocale)
  ) {
    candidates.push(preferredLocale);
  }
  candidates.push(defaultLocale);
  if (defaultLocale !== "en") {
    candidates.push("en");
  }

  const seen = new Set<string>();
  for (const locale of candidates) {
    if (seen.has(locale)) {
      continue;
    }
    seen.add(locale);
    const row = byLocale.get(locale);
    if (
      row !== undefined &&
      row.title_template.trim().length > 0 &&
      row.body_template.trim().length > 0
    ) {
      return row;
    }
  }

  for (const row of rows) {
    if (
      row.title_template.trim().length > 0 &&
      row.body_template.trim().length > 0
    ) {
      return row;
    }
  }
  return null;
}

/**
 * Builds a flat string map for Expo push `data` from notification metadata.
 *
 * @param metadata - JSON metadata stored on the inbox row
 * @param notificationId - Inserted notification id
 * @param type - Notification type
 * @returns Expo-safe data record
 */
function buildPushData(
  metadata: Json | undefined,
  notificationId: string,
  type: string
): Record<string, string | number | boolean | null> {
  const data: Record<string, string | number | boolean | null> = {
    notification_id: notificationId,
    type,
  };

  if (metadata === null || metadata === undefined) {
    return data;
  }
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    return data;
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      data[key] = value;
    } else if (value !== undefined) {
      data[key] = JSON.stringify(value);
    }
  }
  return data;
}

/**
 * Creates an inbox notification and optionally sends Expo push.
 *
 * @param params - User, type, vars/metadata, optional pre-resolved copy
 * @returns Ids and whether push ran or the send was skipped by prefs
 */
export async function createCustomerNotification(
  params: CreateCustomerNotificationParams
): Promise<CreateCustomerNotificationResult> {
  const {
    supabase,
    userId,
    type,
    vars = {},
    metadata,
    resolvedTitle,
    resolvedBody,
    defaultLocale = "en",
  } = params;

  if (userId.trim().length === 0 || type.trim().length === 0) {
    console.error("createCustomerNotification: missing userId or type");
    return { notificationId: null, pushed: false, skipped: true };
  }

  // 1) Load prefs (defaults if missing)
  const { data: prefsRow, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("orders_push, claims_push, promotions, nearby_stock_push")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefsError !== null) {
    console.error("createCustomerNotification: prefs", prefsError.message);
  }

  const prefs = {
    orders_push: prefsRow?.orders_push ?? DEFAULT_PREFS.orders_push,
    claims_push: prefsRow?.claims_push ?? DEFAULT_PREFS.claims_push,
    promotions: prefsRow?.promotions ?? DEFAULT_PREFS.promotions,
    nearby_stock_push:
      prefsRow?.nearby_stock_push ?? DEFAULT_PREFS.nearby_stock_push,
  };

  // 2) Map type → category
  const category = categoryForNotificationType(type);

  // 3) Promotions / nearby_stock off → skip all (no inbox row, no push)
  if (category === "promotions" && prefs.promotions === false) {
    return { notificationId: null, pushed: false, skipped: true };
  }
  if (category === "nearby_stock" && prefs.nearby_stock_push === false) {
    return { notificationId: null, pushed: false, skipped: true };
  }

  // 4) Resolve locale from user_details.preferred_locale
  const { data: detailsRow, error: detailsError } = await supabase
    .from("user_details")
    .select("preferred_locale")
    .eq("id", userId)
    .maybeSingle();

  if (detailsError !== null) {
    console.error("createCustomerNotification: locale", detailsError.message);
  }

  const preferredLocale =
    typeof detailsRow?.preferred_locale === "string"
      ? detailsRow.preferred_locale
      : null;

  // 5) Resolve title/body
  let title: string;
  let body: string;

  const hasResolved =
    typeof resolvedTitle === "string" &&
    resolvedTitle.trim().length > 0 &&
    typeof resolvedBody === "string" &&
    resolvedBody.trim().length > 0;

  if (hasResolved) {
    title = interpolateTemplate(resolvedTitle, vars);
    body = interpolateTemplate(resolvedBody, vars);
  } else {
    const { data: templateRows, error: templateError } = await supabase
      .from("notification_templates")
      .select("locale, title_template, body_template")
      .eq("type", type);

    if (templateError !== null) {
      console.error(
        "createCustomerNotification: templates",
        templateError.message
      );
      return { notificationId: null, pushed: false, skipped: false };
    }

    const picked = pickTemplateRow(
      templateRows ?? [],
      preferredLocale,
      defaultLocale
    );
    if (picked === null) {
      console.error(
        "createCustomerNotification: no template for type",
        type
      );
      return { notificationId: null, pushed: false, skipped: false };
    }

    title = interpolateTemplate(picked.title_template, vars);
    body = interpolateTemplate(picked.body_template, vars);
  }

  if (title.trim().length === 0 && body.trim().length === 0) {
    console.error("createCustomerNotification: empty title and body", type);
    return { notificationId: null, pushed: false, skipped: false };
  }

  // 6) INSERT notifications
  const insertRow: TablesInsert<"notifications"> = {
    user_id: userId,
    type,
    title,
    body,
    metadata: metadata ?? null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("notifications")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError !== null || inserted === null) {
    console.error(
      "createCustomerNotification: insert",
      insertError?.message ?? "no row returned"
    );
    return { notificationId: null, pushed: false, skipped: false };
  }

  const notificationId = inserted.id;

  // 7) Category push flag false (orders/claims) → inbox only.
  // Promotions + nearby_stock were already gated (skip-both) above.
  const pushAllowed =
    category === "promotions" || category === "nearby_stock"
      ? true
      : category === "orders"
        ? prefs.orders_push
        : prefs.claims_push;

  if (!pushAllowed) {
    return { notificationId, pushed: false, skipped: false };
  }

  // 8) Load push_tokens for customer app and send
  const { data: tokenRows, error: tokenError } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("app", "customer");

  if (tokenError !== null) {
    console.error("createCustomerNotification: push_tokens", tokenError.message);
    return { notificationId, pushed: false, skipped: false };
  }

  const tokens = (tokenRows ?? [])
    .map((row) => row.token)
    .filter((token): token is string => typeof token === "string" && token.length > 0);

  if (tokens.length === 0) {
    return { notificationId, pushed: false, skipped: false };
  }

  const pushData = buildPushData(metadata, notificationId, type);
  const pushResult = await sendExpoPushToTokens(tokens, {
    title,
    body,
    data: pushData,
  });

  const pushed = pushResult.ok > 0;
  return { notificationId, pushed, skipped: false };
}
