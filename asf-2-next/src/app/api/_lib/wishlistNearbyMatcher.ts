/**
 * Wishlist nearby-stock matcher (plan §10).
 *
 * For users with a fresh location snapshot and `nearby_stock_push` enabled:
 * find wishlist products in stock at an active store within 1.5 km, respect
 * 7-day cooldown, and send at most one product notification per user per run.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createCustomerNotification } from "@/app/api/_lib/customerNotifications";
import { haversineDistanceKm } from "@/app/api/_lib/haversineDistance";

import type { Database, Json } from "@/database.types";

type ServiceClient = SupabaseClient<Database>;

/** Maximum distance from user snapshot to store (plan locked). */
export const NEARBY_RADIUS_KM = 1.5;

/** Snapshots older than this are ignored (stale GPS). */
export const SNAPSHOT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Cooldown between nearby pushes for the same user + product. */
export const NEARBY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** Structured counters for cron logs. */
export type WishlistNearbyRunStats = {
  snapshotsConsidered: number;
  usersSkippedStaleOrMissing: number;
  usersSkippedPrefOff: number;
  usersSkippedNoWishlist: number;
  usersSkippedNoNearbyStore: number;
  usersSkippedNoStockMatch: number;
  usersSkippedCooldown: number;
  notificationsSent: number;
  notificationsSkippedByPrefs: number;
  errors: number;
};

type StoreCandidate = {
  id: string;
  name: string;
  mall_name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type MatchCandidate = {
  productId: string;
  productName: string;
  store: StoreCandidate;
};

/**
 * Creates an empty stats bag for a matcher run.
 */
export function createEmptyNearbyRunStats(): WishlistNearbyRunStats {
  return {
    snapshotsConsidered: 0,
    usersSkippedStaleOrMissing: 0,
    usersSkippedPrefOff: 0,
    usersSkippedNoWishlist: 0,
    usersSkippedNoNearbyStore: 0,
    usersSkippedNoStockMatch: 0,
    usersSkippedCooldown: 0,
    notificationsSent: 0,
    notificationsSkippedByPrefs: 0,
    errors: 0,
  };
}

/**
 * Parses a numeric DB column that may arrive as number or numeric string.
 *
 * @param value - Raw latitude/longitude/accuracy value
 * @returns Finite number, or null when unusable
 */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Filters active stores within {@link NEARBY_RADIUS_KM} of the snapshot,
 * sorted nearest-first.
 *
 * @param userLat - Snapshot latitude
 * @param userLng - Snapshot longitude
 * @param stores - Active store rows with coordinates
 */
export function findStoresWithinRadius(
  userLat: number,
  userLng: number,
  stores: ReadonlyArray<{
    id: string;
    name: string;
    mall_name: string;
    latitude: number | null;
    longitude: number | null;
  }>
): StoreCandidate[] {
  const nearby: StoreCandidate[] = [];
  for (const store of stores) {
    const storeLat = toFiniteNumber(store.latitude);
    const storeLng = toFiniteNumber(store.longitude);
    if (storeLat === null || storeLng === null) {
      continue;
    }
    const distanceKm = haversineDistanceKm(userLat, userLng, storeLat, storeLng);
    if (distanceKm <= NEARBY_RADIUS_KM) {
      nearby.push({
        id: store.id,
        name: store.name,
        mall_name: store.mall_name,
        latitude: storeLat,
        longitude: storeLng,
        distanceKm,
      });
    }
  }
  nearby.sort((a, b) => a.distanceKm - b.distanceKm);
  return nearby;
}

/**
 * Picks the first wishlist product that is in stock at any nearby store and
 * not under cooldown. Product is available if ANY `store_product_stock` row
 * for (product_id, store) has `count > 0`.
 *
 * @param wishlistProductIds - Ordered wishlist product ids
 * @param nearbyStores - Stores within radius (nearest first)
 * @param stockRows - In-stock rows for wishlist products at those stores
 * @param productNames - Map product_id → display name
 * @param cooldownProductIds - Products already pushed within 7 days
 */
export function pickFirstEligibleMatch(
  wishlistProductIds: readonly string[],
  nearbyStores: readonly StoreCandidate[],
  stockRows: ReadonlyArray<{ product_id: string; store_location_id: string; count: number }>,
  productNames: ReadonlyMap<string, string>,
  cooldownProductIds: ReadonlySet<string>
): MatchCandidate | null {
  const stockedStoreIdsByProduct = new Map<string, Set<string>>();
  for (const row of stockRows) {
    if (row.count <= 0) {
      continue;
    }
    const existing = stockedStoreIdsByProduct.get(row.product_id);
    if (existing !== undefined) {
      existing.add(row.store_location_id);
    } else {
      stockedStoreIdsByProduct.set(row.product_id, new Set([row.store_location_id]));
    }
  }

  for (const productId of wishlistProductIds) {
    if (cooldownProductIds.has(productId)) {
      continue;
    }
    const stockedStores = stockedStoreIdsByProduct.get(productId);
    if (stockedStores === undefined || stockedStores.size === 0) {
      continue;
    }
    for (const store of nearbyStores) {
      if (stockedStores.has(store.id) === false) {
        continue;
      }
      const productName = productNames.get(productId);
      return {
        productId,
        productName:
          typeof productName === "string" && productName.trim().length > 0
            ? productName
            : "Product",
        store,
      };
    }
  }
  return null;
}

/**
 * Runs the full wishlist nearby matcher once (service role).
 *
 * @param supabase - Service-role Supabase client
 * @returns Aggregate counters for structured logging
 */
export async function runWishlistNearbyMatcher(
  supabase: ServiceClient
): Promise<WishlistNearbyRunStats> {
  const stats = createEmptyNearbyRunStats();
  const nowMs = Date.now();
  const snapshotCutoffIso = new Date(nowMs - SNAPSHOT_MAX_AGE_MS).toISOString();
  const cooldownCutoffIso = new Date(nowMs - NEARBY_COOLDOWN_MS).toISOString();

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("user_location_snapshots")
    .select("user_id, latitude, longitude, recorded_at")
    .gte("recorded_at", snapshotCutoffIso);

  if (snapshotError !== null) {
    console.error("wishlist-nearby: snapshots", snapshotError.message);
    stats.errors += 1;
    return stats;
  }

  const snapshots = snapshotRows ?? [];
  stats.snapshotsConsidered = snapshots.length;
  if (snapshots.length === 0) {
    return stats;
  }

  const { data: storeRows, error: storeError } = await supabase
    .from("store_locations")
    .select("id, name, mall_name, latitude, longitude")
    .eq("active", true)
    .is("deleted_at", null);

  if (storeError !== null) {
    console.error("wishlist-nearby: stores", storeError.message);
    stats.errors += 1;
    return stats;
  }

  const activeStores = storeRows ?? [];
  const userIds = snapshots.map((row) => row.user_id);

  const { data: prefRows, error: prefError } = await supabase
    .from("notification_preferences")
    .select("user_id, nearby_stock_push")
    .in("user_id", userIds);

  if (prefError !== null) {
    console.error("wishlist-nearby: prefs", prefError.message);
    stats.errors += 1;
    return stats;
  }

  const prefByUser = new Map<string, boolean>();
  for (const row of prefRows ?? []) {
    prefByUser.set(row.user_id, row.nearby_stock_push !== false);
  }

  for (const snapshot of snapshots) {
    const userId = snapshot.user_id;
    const userLat = toFiniteNumber(snapshot.latitude);
    const userLng = toFiniteNumber(snapshot.longitude);
    if (userLat === null || userLng === null) {
      stats.usersSkippedStaleOrMissing += 1;
      continue;
    }

    const prefEnabled = prefByUser.get(userId) ?? true;
    if (prefEnabled === false) {
      stats.usersSkippedPrefOff += 1;
      continue;
    }

    const nearbyStores = findStoresWithinRadius(userLat, userLng, activeStores);
    if (nearbyStores.length === 0) {
      stats.usersSkippedNoNearbyStore += 1;
      continue;
    }

    const { data: wishlistRows, error: wishlistError } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", userId);

    if (wishlistError !== null) {
      console.error("wishlist-nearby: wishlist", userId, wishlistError.message);
      stats.errors += 1;
      continue;
    }

    const wishlistProductIds = (wishlistRows ?? [])
      .map((row) => row.product_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (wishlistProductIds.length === 0) {
      stats.usersSkippedNoWishlist += 1;
      continue;
    }

    const nearbyStoreIds = nearbyStores.map((store) => store.id);

    const { data: stockRows, error: stockError } = await supabase
      .from("store_product_stock")
      .select("product_id, store_location_id, count")
      .in("product_id", wishlistProductIds)
      .in("store_location_id", nearbyStoreIds)
      .gt("count", 0);

    if (stockError !== null) {
      console.error("wishlist-nearby: stock", userId, stockError.message);
      stats.errors += 1;
      continue;
    }

    if ((stockRows ?? []).length === 0) {
      stats.usersSkippedNoStockMatch += 1;
      continue;
    }

    const { data: cooldownRows, error: cooldownError } = await supabase
      .from("wishlist_nearby_push_log")
      .select("product_id")
      .eq("user_id", userId)
      .in("product_id", wishlistProductIds)
      .gte("sent_at", cooldownCutoffIso);

    if (cooldownError !== null) {
      console.error("wishlist-nearby: cooldown", userId, cooldownError.message);
      stats.errors += 1;
      continue;
    }

    const cooldownProductIds = new Set(
      (cooldownRows ?? [])
        .map((row) => row.product_id)
        .filter((id): id is string => typeof id === "string")
    );

    const stockedProductIds = Array.from(
      new Set((stockRows ?? []).map((row) => row.product_id))
    );

    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .in("id", stockedProductIds);

    if (productError !== null) {
      console.error("wishlist-nearby: products", userId, productError.message);
      stats.errors += 1;
      continue;
    }

    const productNames = new Map<string, string>();
    for (const row of productRows ?? []) {
      productNames.set(row.id, row.name);
    }

    const match = pickFirstEligibleMatch(
      wishlistProductIds,
      nearbyStores,
      stockRows ?? [],
      productNames,
      cooldownProductIds
    );

    if (match === null) {
      if (cooldownProductIds.size > 0) {
        stats.usersSkippedCooldown += 1;
      } else {
        stats.usersSkippedNoStockMatch += 1;
      }
      continue;
    }

    const metadata: Json = {
      deep_link: `product:${match.productId}`,
      product_id: match.productId,
      store_location_id: match.store.id,
    };

    const notifyResult = await createCustomerNotification({
      supabase,
      userId,
      type: "wishlist_nearby_stock",
      vars: {
        product_name: match.productName,
        mall_name: match.store.mall_name,
        store_name: match.store.name,
      },
      metadata,
    });

    if (notifyResult.skipped) {
      stats.notificationsSkippedByPrefs += 1;
      continue;
    }

    if (notifyResult.notificationId === null) {
      stats.errors += 1;
      continue;
    }

    const { error: logError } = await supabase
      .from("wishlist_nearby_push_log")
      .insert({
        user_id: userId,
        product_id: match.productId,
        store_location_id: match.store.id,
        notification_id: notifyResult.notificationId,
      });

    if (logError !== null) {
      console.error("wishlist-nearby: push log", userId, logError.message);
      stats.errors += 1;
      // Notification already sent; still count as sent.
    }

    stats.notificationsSent += 1;
  }

  return stats;
}
