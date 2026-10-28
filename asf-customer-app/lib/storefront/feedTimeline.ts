/**
 * Storefront Home feed timeline — merge posts ∪ promotions (plan §3.1 B).
 *
 * Sort key (locked):
 * ```
 * feedSortAt(item) =
 *   post: coalesce(time_post, created_at)
 *   promo: coalesce(start_date, created_at)
 * ```
 * Descending. Pagination: initial page size 3; subsequent pages size 3.
 */

/** Feed block discriminating union. */
export type StorefrontFeedKind = "post" | "promotion";

/** Minimal post fields for timeline sorting / eligibility. */
export type FeedPostSource = {
  id: string;
  created_at: string;
  time_post: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
};

/** Minimal promotion fields for timeline sorting / eligibility. */
export type FeedPromotionSource = {
  id: string;
  created_at: string;
  start_date: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
};

/**
 * Normalized feed block for Home rendering.
 */
export type StorefrontFeedItem = {
  kind: StorefrontFeedKind;
  id: string;
  /** ISO timestamp used for sort (`feedSortAt`). */
  sortAt: string;
};

/**
 * Default Home feed page size (plan §3.1 pagination).
 */
export const STOREFRONT_FEED_PAGE_SIZE = 3;

/**
 * Parses an ISO-ish date string to epoch ms, or `null` when invalid / empty.
 */
export function parseFeedTimestamp(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.length === 0) {
    return null;
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    return null;
  }
  return ms;
}

/**
 * coalesce(preferred, fallback) as ISO string for sort stability.
 */
export function coalesceFeedSortAt(
  preferred: string | null | undefined,
  fallback: string
): string {
  if (preferred === null || preferred === undefined || preferred.length === 0) {
    return fallback;
  }
  const preferredMs = parseFeedTimestamp(preferred);
  if (preferredMs === null) {
    return fallback;
  }
  return preferred;
}

/**
 * Sort timestamp for a post: `coalesce(time_post, created_at)`.
 */
export function feedSortAtForPost(post: FeedPostSource): string {
  return coalesceFeedSortAt(post.time_post, post.created_at);
}

/**
 * Sort timestamp for a promotion: `coalesce(start_date, created_at)`.
 */
export function feedSortAtForPromotion(promo: FeedPromotionSource): string {
  return coalesceFeedSortAt(promo.start_date, promo.created_at);
}

/**
 * Soft-delete / active / status filter for feed posts.
 */
export function isFeedEligiblePost(post: FeedPostSource): boolean {
  if (post.deleted_at !== null && post.deleted_at !== undefined) {
    if (post.deleted_at.length > 0) {
      return false;
    }
  }
  if (post.active === false) {
    return false;
  }
  if (typeof post.status === "string" && post.status.length > 0) {
    const normalized = post.status.toLowerCase();
    if (
      normalized === "draft" ||
      normalized === "archived" ||
      normalized === "inactive"
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Soft-delete / active filter for feed promotions.
 *
 * Matches {@link filterActivePromotions} / Classic Home: gate on `active` and
 * soft-delete only. Do **not** reject `status = DRAFT` — live demo promos in
 * this project commonly keep DRAFT while `active = true`, and excluding them
 * would drop all Storefront promo feed blocks (R10 / H7).
 */
export function isFeedEligiblePromotion(promo: FeedPromotionSource): boolean {
  if (promo.deleted_at !== null && promo.deleted_at !== undefined) {
    if (promo.deleted_at.length > 0) {
      return false;
    }
  }
  if (promo.active === false) {
    return false;
  }
  return true;
}

/**
 * Merges posts and promotions into one chronological feed (newest first).
 */
export function buildStorefrontFeedTimeline(
  posts: readonly FeedPostSource[],
  promotions: readonly FeedPromotionSource[]
): StorefrontFeedItem[] {
  const items: StorefrontFeedItem[] = [];

  for (const post of posts) {
    if (!isFeedEligiblePost(post)) {
      continue;
    }
    items.push({
      kind: "post",
      id: post.id,
      sortAt: feedSortAtForPost(post),
    });
  }

  for (const promo of promotions) {
    if (!isFeedEligiblePromotion(promo)) {
      continue;
    }
    items.push({
      kind: "promotion",
      id: promo.id,
      sortAt: feedSortAtForPromotion(promo),
    });
  }

  return items.sort((a, b) => {
    const aMs = parseFeedTimestamp(a.sortAt) ?? Number.NEGATIVE_INFINITY;
    const bMs = parseFeedTimestamp(b.sortAt) ?? Number.NEGATIVE_INFINITY;
    if (bMs !== aMs) {
      return bMs - aMs;
    }
    // Stable tie-break: kind then id
    if (a.kind !== b.kind) {
      return a.kind.localeCompare(b.kind);
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Paginates a feed timeline.
 *
 * @param items - Sorted timeline from {@link buildStorefrontFeedTimeline}
 * @param pageIndex - Zero-based page index
 * @param pageSize - Defaults to {@link STOREFRONT_FEED_PAGE_SIZE} (3)
 */
export function paginateStorefrontFeed(
  items: readonly StorefrontFeedItem[],
  pageIndex: number,
  pageSize: number = STOREFRONT_FEED_PAGE_SIZE
): {
  page: StorefrontFeedItem[];
  hasMore: boolean;
} {
  const safePage = pageIndex < 0 ? 0 : pageIndex;
  const safeSize = pageSize <= 0 ? STOREFRONT_FEED_PAGE_SIZE : pageSize;
  const start = safePage * safeSize;
  const page = items.slice(start, start + safeSize);
  const hasMore = start + safeSize < items.length;
  return { page, hasMore };
}

/**
 * Convenience: first N blocks for Home initial paint.
 */
export function takeInitialStorefrontFeed(
  items: readonly StorefrontFeedItem[],
  pageSize: number = STOREFRONT_FEED_PAGE_SIZE
): {
  page: StorefrontFeedItem[];
  hasMore: boolean;
} {
  return paginateStorefrontFeed(items, 0, pageSize);
}
