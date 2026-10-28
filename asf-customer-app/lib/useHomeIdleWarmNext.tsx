import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { useOptionalPostMediaContext } from "@/context/post/PostMediaContext";
import {
  useProductActions,
  useProductData,
} from "@/context/product/ProductContext";
import { useOptionalPromotionContext } from "@/context/PromotionContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { prefetchPrimaryRoutes } from "@/lib/prefetchPrimaryRoutes";
import {
  prefetchWarmImages,
  type WarmImageSources,
} from "@/lib/prefetchWarmImages";
import { logPrioIdleWarm } from "@/lib/prioLog";
import { scheduleAfterIdle } from "@/lib/scheduleAfterIdle";

/** Max missing wishlist SKUs to hydrate after P0 (keeps the pass light). */
const WISHLIST_ENSURE_CAP = 8;

/** How long to hold notifications retain so the P2 fetch can land, then release. */
const NOTIFICATIONS_RETAIN_HOLD_MS = 1200;

/** Idle fallback delay after Home+P0 are ready (lets first paint settle). */
const IDLE_FALLBACK_DELAY_MS = 64;

/**
 * Extra catalog pages to pull after P0 during idle. Storefront Shop's
 * occupation filter often needs 2–3 pages before one grid window fills —
 * without this, first Shop focus still chains P1 while painting.
 */
const IDLE_CATALOG_EXTRA_PAGES = 3;

/** Brief yield between catalog pages so Home stay responsive during warm. */
const IDLE_CATALOG_YIELD_MS = 24;

/**
 * Resolves after `ms`, or sooner when `signal.cancelled` is set.
 *
 * @param ms - Delay in milliseconds
 * @param signal - Shared cancel flag from the hosting effect
 */
function delayOrCancel(
  ms: number,
  signal: { cancelled: boolean }
): Promise<void> {
  const safeMs =
    typeof ms === "number" && Number.isFinite(ms) && ms >= 0 ? ms : 0;

  return new Promise((resolve) => {
    if (signal.cancelled || safeMs === 0) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      clearInterval(poll);
      resolve();
    }, safeMs);

    const poll = setInterval(() => {
      if (signal.cancelled) {
        clearTimeout(timer);
        clearInterval(poll);
        resolve();
      }
    }, 50);
  });
}

type WarmPassRefs = {
  hasMoreRef: { current: boolean };
  loadMoreRef: { current: () => Promise<void> };
  retainNotificationsRef: { current: () => () => void };
  prefetchRoutes: () => void;
  /** Snapshot getter so image warm always sees the latest P0/P2 rows. */
  getImageSources: () => WarmImageSources;
};

/**
 * Pulls up to {@link IDLE_CATALOG_EXTRA_PAGES} P1 pages so Shop's fill-window
 * effect has less work on first focus.
 *
 * @param signal - Cancel flag from Home blur / unmount
 * @param refs - Product pagination refs
 */
async function warmShopCatalog(
  signal: { cancelled: boolean },
  refs: Pick<WarmPassRefs, "hasMoreRef" | "loadMoreRef">
): Promise<void> {
  let pagesLoaded = 0;

  while (
    !signal.cancelled &&
    refs.hasMoreRef.current &&
    pagesLoaded < IDLE_CATALOG_EXTRA_PAGES
  ) {
    logPrioIdleWarm(
      "shop",
      `loadMoreProducts +${String(pagesLoaded + 1)}`
    );
    await refs.loadMoreRef.current();
    pagesLoaded += 1;
    if (
      !signal.cancelled &&
      refs.hasMoreRef.current &&
      pagesLoaded < IDLE_CATALOG_EXTRA_PAGES
    ) {
      await delayOrCancel(IDLE_CATALOG_YIELD_MS, signal);
    }
  }

  if (pagesLoaded === 0) {
    logPrioIdleWarm("shop", "skip already covered");
  }
}

/**
 * Sequential warm steps — avoids firing provider fetches in parallel.
 * Order: route PRELOAD (Metro + first mount) → image prefetch → catalog
 * pages → notifications. Routes run first so leaving Home mid-catalog still
 * keeps Shop/Highlights preloaded.
 */
async function runIdleWarmPass(
  signal: { cancelled: boolean },
  refs: WarmPassRefs
): Promise<void> {
  logPrioIdleWarm("start");

  // 1) Primary tab PRELOAD — must not wait on multi-page catalog warm
  if (!signal.cancelled) {
    refs.prefetchRoutes();
  }

  // 2) expo-image warm for Home hero / arrivals / early Shop tiles
  if (!signal.cancelled) {
    await prefetchWarmImages(refs.getImageSources(), signal);
  }

  // 3) Extra P1 catalog pages for Shop fill-window
  if (!signal.cancelled) {
    await warmShopCatalog(signal, refs);
  }

  // 4) Brief notifications retain (P2)
  if (!signal.cancelled) {
    await warmNotifications(signal, refs.retainNotificationsRef.current);
  }

  if (!signal.cancelled) {
    logPrioIdleWarm("done");
  } else {
    logPrioIdleWarm("cancel");
  }
}

/**
 * Brief P2 retain so notifications hydrate into context, then release.
 * List state persists after release; realtime tears down until Profile focus.
 *
 * @param signal - Cancel flag from Home blur / unmount
 * @param retainFocus - Notification provider retain API
 */
async function warmNotifications(
  signal: { cancelled: boolean },
  retainFocus: () => () => void
): Promise<void> {
  logPrioIdleWarm("notifications", "retain");
  const release = retainFocus();
  try {
    await delayOrCancel(NOTIFICATIONS_RETAIN_HOLD_MS, signal);
  } finally {
    release();
  }
}

/**
 * Collects wishlist product ids not present in the current catalog snapshot.
 *
 * @param productIds - Wishlist row product ids
 * @param products - Currently loaded catalog products
 * @returns Up to {@link WISHLIST_ENSURE_CAP} missing ids
 */
function collectMissingWishlistProductIds(
  productIds: ReadonlyArray<string>,
  products: ReadonlyArray<{ id: string }>
): string[] {
  const loaded = new Set(products.map((product) => product.id));
  const missing: string[] = [];
  for (const productId of productIds) {
    if (productId.length === 0) {
      continue;
    }
    if (loaded.has(productId)) {
      continue;
    }
    missing.push(productId);
    if (missing.length >= WISHLIST_ENSURE_CAP) {
      break;
    }
  }
  return missing;
}

/**
 * After Home is focused and P0 products are ready, schedules one idle pass that
 * preloads primary tab routes (Expo Router PRELOAD — Metro + first scene mount),
 * prefetches a small set of Home/Shop image URIs, warms Shop (extra catalog
 * pages), and briefly retains notifications (P2). Wishlist SKU hydration lives
 * in {@link HomeIdleWarmWishlistBridge} so it stays behind the wishlist feature
 * gate.
 *
 * Cancels pending idle work and aborts in-flight steps when Home blurs or
 * unmounts. Route PRELOAD runs before catalog pages so early leave still keeps
 * Shop/Highlights bundled. Prefetch is idempotent with focus retain paths.
 */
export function useHomeIdleWarmNext(): void {
  const { isEnabled } = useFeatureFlags();
  const { loading: productsLoading, hasMore, products } = useProductData();
  const { loadMoreProducts } = useProductActions();
  const { retainFocus: retainNotifications } = useNotificationContext();
  const postMediaCtx = useOptionalPostMediaContext();
  const promoCtx = useOptionalPromotionContext();

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const loadMoreRef = useRef(loadMoreProducts);
  loadMoreRef.current = loadMoreProducts;
  const retainNotificationsRef = useRef(retainNotifications);
  retainNotificationsRef.current = retainNotifications;
  const productsLoadingRef = useRef(productsLoading);
  productsLoadingRef.current = productsLoading;
  const productsRef = useRef(products);
  productsRef.current = products;
  const postMediasRef = useRef(postMediaCtx?.postMedias);
  postMediasRef.current = postMediaCtx?.postMedias;
  const promotionsRef = useRef(promoCtx?.promotions);
  promotionsRef.current = promoCtx?.promotions;

  const highlightsEnabled = isEnabled("highlights");
  const locationsEnabled = isEnabled("store_locations");
  const wishlistEnabled = isEnabled("wishlist");

  const prefetchRoutes = useCallback((): void => {
    prefetchPrimaryRoutes({
      highlights: highlightsEnabled,
      locations: locationsEnabled,
      wishlist: wishlistEnabled,
    });
  }, [highlightsEnabled, locationsEnabled, wishlistEnabled]);

  const getImageSources = useCallback((): WarmImageSources => {
    const postMedias = postMediasRef.current;
    const promotions = promotionsRef.current;
    return {
      products: productsRef.current,
      ...(postMedias !== undefined ? { postMedias } : {}),
      ...(promotions !== undefined ? { promotions } : {}),
    };
  }, []);

  /**
   * Focus gate: schedule idle warm only while Home is focused.
   * Re-checks P0 readiness when `productsLoading` flips (callback identity).
   */
  useFocusEffect(
    useCallback(() => {
      if (productsLoadingRef.current) {
        return;
      }

      const signal = { cancelled: false };

      const idle = scheduleAfterIdle(() => {
        if (signal.cancelled || productsLoadingRef.current) {
          return;
        }
        void runIdleWarmPass(signal, {
          hasMoreRef,
          loadMoreRef,
          retainNotificationsRef,
          prefetchRoutes,
          getImageSources,
        });
      }, IDLE_FALLBACK_DELAY_MS);

      return () => {
        signal.cancelled = true;
        idle.cancel();
      };
    }, [productsLoading, prefetchRoutes, getImageSources])
  );
}

/**
 * Idle-ensures wishlist SKUs missing from the P0/P1 catalog so the wishlist
 * screen can join product cards without waiting on focus. Must render under
 * {@link WishlistProvider} (feature-gated by the Home route).
 */
export function HomeIdleWarmWishlistBridge(): null {
  const { loading: productsLoading, products } = useProductData();
  const { ensureProduct } = useProductActions();
  const { wishlistItems, loading: wishlistLoading } = useWishlistContext();

  const productsRef = useRef(products);
  productsRef.current = products;
  const ensureProductRef = useRef(ensureProduct);
  ensureProductRef.current = ensureProduct;
  const productsLoadingRef = useRef(productsLoading);
  productsLoadingRef.current = productsLoading;
  const wishlistLoadingRef = useRef(wishlistLoading);
  wishlistLoadingRef.current = wishlistLoading;
  /** Ids already requested this Home session — avoids cancel/restart on catalog append. */
  const ensuredIdsRef = useRef<Set<string>>(new Set());

  const wishlistKey = useMemo(
    () =>
      wishlistItems
        .map((item) => item.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .join(","),
    [wishlistItems]
  );
  const wishlistKeyRef = useRef(wishlistKey);
  wishlistKeyRef.current = wishlistKey;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let idleCancel: (() => void) | undefined;

      const trySchedule = (): void => {
        if (cancelled) {
          return;
        }
        if (productsLoadingRef.current || wishlistLoadingRef.current) {
          return;
        }
        const key = wishlistKeyRef.current;
        if (key.length === 0) {
          return;
        }

        const signal = { cancelled: false };
        const idle = scheduleAfterIdle(() => {
          void (async (): Promise<void> => {
            if (signal.cancelled) {
              return;
            }
            const productIds = key.split(",");
            const missingIds = collectMissingWishlistProductIds(
              productIds,
              productsRef.current
            ).filter((id) => !ensuredIdsRef.current.has(id));

            if (missingIds.length === 0) {
              logPrioIdleWarm("wishlist", "skip none missing");
              return;
            }

            logPrioIdleWarm(
              "wishlist",
              `ensureProduct x${String(missingIds.length)}`
            );
            for (const productId of missingIds) {
              if (signal.cancelled) {
                return;
              }
              await ensureProductRef.current(productId);
              ensuredIdsRef.current.add(productId);
            }
          })();
        }, IDLE_FALLBACK_DELAY_MS);

        idleCancel = (): void => {
          signal.cancelled = true;
          idle.cancel();
        };
      };

      trySchedule();

      return () => {
        cancelled = true;
        if (idleCancel !== undefined) {
          idleCancel();
        }
      };
    }, [productsLoading, wishlistLoading, wishlistKey])
  );

  return null;
}

/**
 * Home-route host: runs route PRELOAD + image prefetch + catalog + notifications
 * idle warm; optionally mounts the wishlist ensure bridge when the feature flag
 * is on.
 */
export function HomeIdleWarmNext(): React.ReactElement | null {
  const { isEnabled } = useFeatureFlags();
  useHomeIdleWarmNext();

  if (!isEnabled("wishlist")) {
    return null;
  }

  return <HomeIdleWarmWishlistBridge />;
}
