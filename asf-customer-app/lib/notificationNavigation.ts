/**
 * Resolves in-app routes from `notifications.metadata` / Expo push `data`.
 *
 * Allowed targets (plan §11 / §13):
 * - `order_id` → order detail
 * - `claim_id` → claim detail
 * - `registration_id` → collection detail
 * - `ticket_id` → support hub
 * - `deep_link` internal Expo path (`/(tabs)/…`) or `product:<uuid>` / `order:<uuid>` /
 *   `claim:<uuid>` / `registration:<uuid>` / `ticket:<uuid>`
 *
 * Rejects open redirects (`http(s):`, `//…`, non-app schemes).
 */

import type { Href, ImperativeRouter } from "expo-router";

import type { Json } from "@/database.types";
import { openBrowseCatalog } from "@/lib/browseNavigation";

/**
 * Where the notifications inbox back control should return when opened from
 * Storefront chrome outside the Profile tab.
 */
export type NotificationInboxReturnTo = "home" | "shop" | "highlights";

/**
 * Type guard for {@link NotificationInboxReturnTo} route params.
 */
function isNotificationInboxReturnTo(value: string): value is NotificationInboxReturnTo {
  return value === "home" || value === "shop" || value === "highlights";
}

/**
 * Normalizes a route search param to a known {@link NotificationInboxReturnTo}.
 *
 * @param value - Raw Expo Router param (`string`, `string[]`, or missing).
 * @returns A valid return target, or `null` when absent or unknown (Profile stack back).
 */
export function resolveNotificationInboxReturnTo(
  value: string | string[] | undefined,
): NotificationInboxReturnTo | null {
  const raw =
    typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
  if (typeof raw === "string" && isNotificationInboxReturnTo(raw)) {
    return raw;
  }
  return null;
}

export interface OpenNotificationInboxOptions {
  /** Tab/screen to restore when the user taps back on the inbox. Omit for Profile stack pop. */
  returnTo?: NotificationInboxReturnTo;
}

/**
 * Opens the shared notifications inbox under the Profile tab.
 *
 * When `returnTo` is set (Storefront bell from Home / Shop / Highlights), the
 * inbox back control restores that entry screen instead of popping stale Profile
 * stack history (e.g. Theme / Appearance).
 */
export function openNotificationInbox(
  router: ImperativeRouter,
  options?: OpenNotificationInboxOptions,
): void {
  const returnTo = options?.returnTo;
  if (returnTo !== undefined) {
    router.push({
      pathname: "/(tabs)/profile/notifications",
      params: { returnTo },
    });
    return;
  }
  router.push("/(tabs)/profile/notifications");
}

/**
 * Navigates away from the inbox according to the entry-point `returnTo` param.
 *
 * @param router - Expo Router instance
 * @param returnTo - Origin screen passed when opening from Storefront chrome
 */
export function leaveNotificationInbox(
  router: ImperativeRouter,
  returnTo: NotificationInboxReturnTo,
): void {
  // Collapse the profile stack to the hub so revisiting the Profile tab does not
  // reopen the inbox left behind by cross-tab entry from Storefront chrome.
  router.replace("/(tabs)/profile");

  if (returnTo === "home") {
    router.navigate("/(tabs)/" as Href);
    return;
  }
  if (returnTo === "shop") {
    openBrowseCatalog(router);
    return;
  }
  router.navigate("/(tabs)/highlights" as Href);
}

/** UUID v4-ish pattern used to validate structured deep-link ids. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true when `value` looks like a UUID suitable for path segments.
 *
 * @param value - Candidate id string
 */
function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Narrows unknown metadata / push data into a plain string-keyed record.
 *
 * @param value - Raw metadata JSON or push data object
 * @returns Record of unknown values, or null
 */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Reads a non-empty string field from a metadata record.
 *
 * @param record - Metadata map
 * @param key - Field name
 * @returns Trimmed string, or null
 */
function readStringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const raw = record[key];
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates an internal Expo Router path (must start with `/`, not `//`).
 *
 * @param path - Candidate path
 * @returns Path string when safe, otherwise null
 */
function sanitizeInternalPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Parses campaign / promo `deep_link` conventions into an app href.
 *
 * @param deepLink - Raw deep_link string from metadata
 * @returns Safe {@link Href}, or null when unrecognized / unsafe
 */
function hrefFromDeepLink(deepLink: string): Href | null {
  const trimmed = deepLink.trim();

  if (trimmed.startsWith("product:")) {
    const id = trimmed.slice("product:".length).trim();
    if (!isUuid(id)) {
      return null;
    }
    return `/(tabs)/browse/${id}`;
  }

  if (trimmed.startsWith("order:")) {
    const id = trimmed.slice("order:".length).trim();
    if (!isUuid(id)) {
      return null;
    }
    return `/(tabs)/profile/orders/${id}`;
  }

  if (trimmed.startsWith("claim:")) {
    const id = trimmed.slice("claim:".length).trim();
    if (!isUuid(id)) {
      return null;
    }
    return `/(tabs)/profile/claims/${id}`;
  }

  if (trimmed.startsWith("registration:")) {
    const id = trimmed.slice("registration:".length).trim();
    if (!isUuid(id)) {
      return null;
    }
    return `/(tabs)/profile/collection/${id}`;
  }

  if (trimmed.startsWith("ticket:")) {
    const id = trimmed.slice("ticket:".length).trim();
    if (!isUuid(id)) {
      return null;
    }
    return "/(tabs)/profile/support";
  }

  const internal = sanitizeInternalPath(trimmed);
  if (internal === null) {
    return null;
  }

  return internal as Href;
}

/**
 * Resolves a navigation target from notification metadata or Expo push data.
 *
 * Priority: explicit entity ids → `deep_link` string.
 *
 * @param metadata - `notifications.metadata` or push `content.data`
 * @returns Expo Router href, or null when nothing navigable is present
 */
export function resolveNotificationHref(
  metadata: Json | Record<string, unknown> | null | undefined,
): Href | null {
  const record = asRecord(metadata);
  if (record === null) {
    return null;
  }

  const orderId = readStringField(record, "order_id");
  if (orderId !== null && isUuid(orderId)) {
    return `/(tabs)/profile/orders/${orderId}`;
  }

  const claimId = readStringField(record, "claim_id");
  if (claimId !== null && isUuid(claimId)) {
    return `/(tabs)/profile/claims/${claimId}`;
  }

  const registrationId = readStringField(record, "registration_id");
  if (registrationId !== null && isUuid(registrationId)) {
    return `/(tabs)/profile/collection/${registrationId}`;
  }

  const ticketId = readStringField(record, "ticket_id");
  if (ticketId !== null && isUuid(ticketId)) {
    return "/(tabs)/profile/support";
  }

  const deepLink = readStringField(record, "deep_link");
  if (deepLink !== null) {
    return hrefFromDeepLink(deepLink);
  }

  return null;
}
