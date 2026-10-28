/**
 * Store-welcome popup types, nearby-stock detection, and Design Lab demo payload.
 *
 * Nearby wishlist stock notifications carry `type: "wishlist_nearby_stock"` plus
 * metadata `{ product_id, store_location_id, deep_link: "product:<uuid>" }`
 * (see server `wishlistNearbyMatcher` / `createCustomerNotification`).
 */

import type { Json } from "@/database.types";
import type { WelcomeVariantId } from "@/lib/designPreview";

/** Notification type written by the wishlist nearby matcher. */
export const WISHLIST_NEARBY_STOCK_TYPE = "wishlist_nearby_stock";

/** Mall short name used in Design Lab Mid Valley preview copy. */
export const STORE_WELCOME_DEMO_MALL_SHORT = "Mid Valley";

/** Full store name for Mid Valley demo (matches seeded `store_locations.name`). */
export const STORE_WELCOME_DEMO_STORE_NAME = "Model Match Mid Valley";

/**
 * Seeded Mid Valley `store_locations.id` for Design Lab Preview resolution.
 * Matches the live row named {@link STORE_WELCOME_DEMO_STORE_NAME}.
 */
export const STORE_WELCOME_DEMO_STORE_LOCATION_ID =
  "f446a72d-971f-43f2-b375-05e673cc486c";

/**
 * First Mid Valley mall photo from seeded `store_locations.image_urls`
 * (Wikimedia commons — proud-of-store / arrival mood for editorial welcome).
 */
export const STORE_WELCOME_DEMO_STORE_IMAGE_URI =
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/Mid_Valley_Megamall_2020_1.jpg";

/** Welcome UIs that actually render a popup (`off` keeps PDP-only taps). */
export type ActiveWelcomeVariantId = Exclude<WelcomeVariantId, "off">;

/**
 * Payload for presenting a store-welcome popup.
 */
export type StoreWelcomePayload = {
  /** Mall short name shown in “Welcome to {mall}”. */
  mallShortName: string;
  /** Optional full store name (e.g. Model Match Mid Valley). */
  storeFullName: string | null;
  /** Matched `store_locations.id` when known. */
  storeLocationId: string | null;
  /**
   * Optional store / mall photo URI (`store_locations.image_urls[0]`).
   * Used by editorial welcome (variant 2); host may also resolve from catalog.
   */
  storeImageUri: string | null;
  /** Wishlist product id when known. */
  productId: string | null;
  /** Optional product display name hint (resolved from catalog when missing). */
  productNameHint: string | null;
};

/**
 * Picks the first usable store photo from `store_locations.image_urls`.
 * Skips empty strings and common placeholder hosts.
 *
 * @param imageUrls - Raw image URL array from a store location row
 */
export function firstUsableStoreImageUri(
  imageUrls: ReadonlyArray<string> | null | undefined,
): string | null {
  if (imageUrls === null || imageUrls === undefined) {
    return null;
  }
  for (const raw of imageUrls) {
    if (typeof raw !== "string") {
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.includes("picsum.photos")) {
      continue;
    }
    return trimmed;
  }
  return null;
}

/**
 * Narrows unknown metadata / push data into a plain string-keyed record.
 *
 * @param value - Raw metadata JSON or push data object
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
 * Extracts a product UUID from a `product:<uuid>` deep_link when present.
 *
 * @param deepLink - Raw deep_link string
 */
function productIdFromDeepLink(deepLink: string): string | null {
  const trimmed = deepLink.trim();
  if (!trimmed.startsWith("product:")) {
    return null;
  }
  const id = trimmed.slice("product:".length).trim();
  return id.length > 0 ? id : null;
}

/**
 * Returns true when the notification is nearby wishlist stock.
 *
 * Detects via `type === wishlist_nearby_stock`, or metadata that carries both
 * `store_location_id` and a product id (`product_id` or `product:` deep_link).
 *
 * @param type - `notifications.type` or push `data.type`
 * @param metadata - Inbox metadata or Expo push `content.data`
 */
export function isNearbyWishlistStockNotification(
  type: string | null | undefined,
  metadata: Json | Record<string, unknown> | null | undefined,
): boolean {
  if (typeof type === "string" && type.trim() === WISHLIST_NEARBY_STOCK_TYPE) {
    return true;
  }

  const record = asRecord(metadata);
  if (record === null) {
    return false;
  }

  const typeFromMeta = readStringField(record, "type");
  if (typeFromMeta === WISHLIST_NEARBY_STOCK_TYPE) {
    return true;
  }

  const storeLocationId = readStringField(record, "store_location_id");
  if (storeLocationId === null) {
    return false;
  }

  const productId = readStringField(record, "product_id");
  if (productId !== null) {
    return true;
  }

  const deepLink = readStringField(record, "deep_link");
  if (deepLink !== null && productIdFromDeepLink(deepLink) !== null) {
    return true;
  }

  return false;
}

/**
 * Builds a {@link StoreWelcomePayload} from notification type + metadata.
 *
 * @param type - Notification type string when available
 * @param metadata - Inbox metadata or push data
 * @param mallShortFallback - Mall label when store row is not yet resolved
 * @returns Payload, or null when the notification is not nearby-stock shaped
 */
export function extractStoreWelcomePayload(
  type: string | null | undefined,
  metadata: Json | Record<string, unknown> | null | undefined,
  mallShortFallback: string = STORE_WELCOME_DEMO_MALL_SHORT,
): StoreWelcomePayload | null {
  if (!isNearbyWishlistStockNotification(type, metadata)) {
    return null;
  }

  const record = asRecord(metadata);
  const storeLocationId =
    record !== null ? readStringField(record, "store_location_id") : null;
  const productIdDirect =
    record !== null ? readStringField(record, "product_id") : null;
  const deepLink = record !== null ? readStringField(record, "deep_link") : null;
  const productIdFromLink =
    deepLink !== null ? productIdFromDeepLink(deepLink) : null;
  const productId = productIdDirect ?? productIdFromLink;

  const mallFromMeta =
    record !== null ? readStringField(record, "mall_name") : null;
  const storeNameFromMeta =
    record !== null ? readStringField(record, "store_name") : null;

  const storeImageFromMeta =
    record !== null ? readStringField(record, "store_image_url") : null;

  return {
    mallShortName:
      mallFromMeta !== null && mallFromMeta.length > 0
        ? mallFromMeta
        : mallShortFallback,
    storeFullName: storeNameFromMeta,
    storeLocationId,
    storeImageUri: storeImageFromMeta,
    productId,
    productNameHint:
      record !== null ? readStringField(record, "product_name") : null,
  };
}

/**
 * Demo Mid Valley payload for Design Lab Preview (no GPS / inbox required).
 * `productId` is left null so the host can fill from the loaded catalog.
 * Seeds Mid Valley `storeLocationId` + mall photo so editorial welcome (2)
 * shows store imagery even when Locations P2 catalog has not been retained.
 */
export function createDemoStoreWelcomePayload(): StoreWelcomePayload {
  return {
    mallShortName: STORE_WELCOME_DEMO_MALL_SHORT,
    storeFullName: STORE_WELCOME_DEMO_STORE_NAME,
    storeLocationId: STORE_WELCOME_DEMO_STORE_LOCATION_ID,
    storeImageUri: STORE_WELCOME_DEMO_STORE_IMAGE_URI,
    productId: null,
    productNameHint: null,
  };
}

/**
 * Resolves which visual variant to render for a preview or notification tap.
 *
 * When Design Lab selection is `off`, Preview falls back to Flagship cover (`1`)
 * for QA. Real notification taps should not call this when variant is `off`
 * (PDP path).
 *
 * @param selected - Persisted Design Lab welcome selection
 */
export function resolveActiveWelcomeVariant(
  selected: WelcomeVariantId,
): ActiveWelcomeVariantId {
  if (selected === "off") {
    return "1";
  }
  return selected;
}
