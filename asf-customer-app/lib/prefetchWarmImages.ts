import { Image } from "expo-image";

import { logPrioIdleWarm } from "@/lib/prioLog";
import { takeNewestProducts } from "@/lib/storefront/newestProducts";
import {
  resolveProductPrimaryMediaUrl,
  type ProductColorMediaSource,
} from "@/lib/storefront/productColorMedia";

/** Soft cap on idle-warm image prefetch (Home hero + arrivals + Shop tiles). */
export const IDLE_IMAGE_PREFETCH_CAP = 10;

/** Max distinct post hero / feed image URLs to include before product tiles. */
const WARM_POST_IMAGE_CAP = 2;

/** Max newest-product (arrivals) URLs preferred before the rest of P0. */
const WARM_ARRIVALS_IMAGE_CAP = 6;

/** Max promotion banner URLs when already hydrated (non-blocking). */
const WARM_PROMO_IMAGE_CAP = 2;

/**
 * Minimal post-media row for hero / feed URI collection.
 * Compatible with {@link PostMedia} from PostMediaContext.
 */
export type WarmPostMediaRow = {
  post_id: string;
  media_url: string;
  media_type: string;
  arrangement: number | null;
};

/**
 * Minimal promotion row for optional banner URI collection.
 */
export type WarmPromotionImageRow = {
  image_url: string | null;
};

/**
 * Snapshot inputs for one idle-warm image prefetch pass.
 * All arrays should already be in memory (P0 / P2 retain) — no network here.
 */
export type WarmImageSources = {
  /** Currently loaded catalog products (P0+). */
  products: ReadonlyArray<ProductColorMediaSource & { created_at: string }>;
  /** Post medias when Highlights/PostMedia providers are mounted. */
  postMedias?: ReadonlyArray<WarmPostMediaRow>;
  /** Promotions when the promotions gate has already hydrated rows. */
  promotions?: ReadonlyArray<WarmPromotionImageRow>;
};

/**
 * True when a URI looks usable for {@link Image.prefetch}.
 *
 * @param uri - Candidate media URL
 */
function isPrefetchableUri(uri: string): boolean {
  const trimmed = uri.trim();
  if (trimmed.length === 0) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    lower.startsWith("file://") ||
    lower.startsWith("data:")
  );
}

/**
 * Appends a URI when under cap, non-empty, prefetchable, and not yet seen.
 *
 * @param uris - Accumulator
 * @param seen - Dedupe set
 * @param candidate - Raw URI or nullish
 * @param cap - Absolute max length for `uris`
 */
function pushUri(
  uris: string[],
  seen: Set<string>,
  candidate: string | null | undefined,
  cap: number
): void {
  if (uris.length >= cap) {
    return;
  }
  if (typeof candidate !== "string") {
    return;
  }
  const trimmed = candidate.trim();
  if (!isPrefetchableUri(trimmed) || seen.has(trimmed)) {
    return;
  }
  seen.add(trimmed);
  uris.push(trimmed);
}

/**
 * Collects first image URL per post (lowest `arrangement`), skipping videos.
 *
 * @param postMedias - Flat post_medias rows
 * @param limit - Max distinct posts
 */
function collectPostImageUris(
  postMedias: ReadonlyArray<WarmPostMediaRow>,
  limit: number
): string[] {
  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
  if (safeLimit === 0 || postMedias.length === 0) {
    return [];
  }

  const sorted = [...postMedias].sort((a, b) => {
    const aArr =
      typeof a.arrangement === "number"
        ? a.arrangement
        : Number.MAX_SAFE_INTEGER;
    const bArr =
      typeof b.arrangement === "number"
        ? b.arrangement
        : Number.MAX_SAFE_INTEGER;
    if (aArr !== bArr) {
      return aArr - bArr;
    }
    return a.post_id.localeCompare(b.post_id);
  });

  const uris: string[] = [];
  const seenPosts = new Set<string>();

  for (const row of sorted) {
    if (uris.length >= safeLimit) {
      break;
    }
    if (seenPosts.has(row.post_id)) {
      continue;
    }
    const mediaType = row.media_type.trim().toLowerCase();
    if (mediaType === "video") {
      continue;
    }
    const url = row.media_url.trim();
    if (!isPrefetchableUri(url)) {
      continue;
    }
    seenPosts.add(row.post_id);
    uris.push(url);
  }

  return uris;
}

/**
 * Builds a capped, deduped URI list for idle warm:
 * post hero → newest arrivals → remaining P0 product tiles → promos.
 *
 * @param sources - In-memory catalog / media / promo snapshots
 * @param cap - Max URIs (default {@link IDLE_IMAGE_PREFETCH_CAP})
 */
export function collectWarmImageUris(
  sources: WarmImageSources,
  cap: number = IDLE_IMAGE_PREFETCH_CAP
): string[] {
  const safeCap =
    typeof cap === "number" && Number.isFinite(cap)
      ? Math.max(0, Math.floor(cap))
      : IDLE_IMAGE_PREFETCH_CAP;
  if (safeCap === 0) {
    return [];
  }

  const uris: string[] = [];
  const seen = new Set<string>();

  // 1) Home hero / early feed — a couple of post images when Highlights is on
  if (sources.postMedias !== undefined) {
    for (const uri of collectPostImageUris(
      sources.postMedias,
      WARM_POST_IMAGE_CAP
    )) {
      pushUri(uris, seen, uri, safeCap);
    }
  }

  // 2) Latest arrivals (newest-first) — mirrors Home 2×3 priority
  const arrivals = takeNewestProducts(
    sources.products,
    WARM_ARRIVALS_IMAGE_CAP
  );
  for (const product of arrivals) {
    pushUri(uris, seen, resolveProductPrimaryMediaUrl(product), safeCap);
  }

  // 3) Remaining P0 / Shop-ish tiles in catalog order
  for (const product of sources.products) {
    pushUri(uris, seen, resolveProductPrimaryMediaUrl(product), safeCap);
  }

  // 4) Promotion banners when already cheaply available
  if (sources.promotions !== undefined) {
    let promoCount = 0;
    for (const promo of sources.promotions) {
      if (promoCount >= WARM_PROMO_IMAGE_CAP || uris.length >= safeCap) {
        break;
      }
      const before = uris.length;
      pushUri(uris, seen, promo.image_url, safeCap);
      if (uris.length > before) {
        promoCount += 1;
      }
    }
  }

  return uris;
}

/**
 * Prefetches a small set of Home/Shop image URIs via expo-image.
 * Fail-soft: never throws; respects cancel before starting and after await.
 *
 * @param sources - In-memory snapshots (products required; posts/promos optional)
 * @param signal - Idle-warm cancel flag from Home blur / unmount
 * @returns Number of URIs handed to {@link Image.prefetch} (0 when skipped)
 */
export async function prefetchWarmImages(
  sources: WarmImageSources,
  signal: { cancelled: boolean }
): Promise<number> {
  if (signal.cancelled) {
    return 0;
  }

  const uris = collectWarmImageUris(sources);
  if (uris.length === 0) {
    logPrioIdleWarm("images", "skip none");
    return 0;
  }

  logPrioIdleWarm("images", `prefetch x${String(uris.length)}`);

  try {
    await Image.prefetch(uris);
  } catch (error: unknown) {
    if (__DEV__) {
      const message =
        error instanceof Error ? error.message : "unknown error";
      logPrioIdleWarm("images", `prefetch failed ${message}`);
    }
  }

  return uris.length;
}
