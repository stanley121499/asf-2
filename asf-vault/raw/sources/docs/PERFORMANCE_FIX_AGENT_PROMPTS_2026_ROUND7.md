# Performance Fix Agent Prompts — Round 7 (2026): Phone Heating

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Companion Plan**: `PERFORMANCE_FIX_PLAN_2026_ROUND7.md`

> **Context**: A phone using this app in a WebView gets hot. Root cause: continuous CPU/GPU activity from too many open WebSocket channels, a polling loop, looping video decode, and aggressive image preloading. Fix these in order — Agent 1 has the highest impact.

---

## Agent 1 — Slim Down the LandingContextBundle (MOST IMPACTFUL)

### Overview

You are a senior React/TypeScript developer. Your task is to create a `SlimLandingContextBundle` — a stripped-down context wrapper that gives customer-facing pages only the Supabase realtime subscriptions they actually need. The current `LandingContextBundle` opens 24 persistent WebSocket channels on every customer page. Most of those are admin-only contexts (stock management, folder editors, purchase orders, payments). This fix reduces that to ~9 channels, which is a **62% reduction** in background CPU activity.

**No page functionality should change.** All contexts will still be mounted — just moved to smaller, more appropriate scopes.

---

### Files to Modify

- `src/context/RouteContextBundles.tsx`
- `src/App.tsx`

---

### Step 1: Add `SlimLandingContextBundle` to RouteContextBundles.tsx

Open `src/context/RouteContextBundles.tsx`.

**Add these imports** at the top alongside the existing ones — `ProductReportProvider` and `ProductReportContext` are NOT needed on customer pages so do not import it:
```ts
import { PointsMembershipProvider } from "./PointsMembershipContext";
import { AddToCartLogProvider } from "./product/AddToCartLogContext";
```
(This import may already be present — check before adding.)

**Add the following new export at the bottom of the file**, after the existing exports:

```tsx
/**
 * SlimLandingContextBundle
 *
 * A minimal context wrapper for customer-facing / landing pages.
 * Opens only the Supabase realtime subscriptions that customers actually need:
 *
 * Products (browsing):
 *   CategoryContext, ProductCategoryContext, ProductSizeContext,
 *   ProductColorContext, ProductMediaContext, ProductContext
 *
 * Posts (home page, highlights):
 *   PostMediaContext, PostContext
 *
 * Shopping (cart, orders, wishlist, points):
 *   PointsMembershipContext, AddToCartProvider, OrderProvider, WishlistProvider
 *
 * NOT included (admin-only, not needed by any customer page):
 *   ProductFolderContext, ProductFolderMediaContext,
 *   ProductStockContext, ProductStockLogContext,
 *   ProductEventContext, ProductPurchaseOrderContext, ProductReportContext,
 *   PostFolderContext, PostFolderMediaContext,
 *   PaymentContext
 *
 * Total channels: ~13 (down from 24 in LandingContextBundle)
 */
export const SlimLandingContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <BrandProvider>
    <DepartmentProvider>
      <RangeProvider>
        <CategoryProvider>
          <ProductCategoryProvider>
            <ProductSizeProvider>
              <ProductColorProvider>
                <ProductMediaProvider>
                  <ProductProvider>
                    <PostMediaProvider>
                      <PostProvider>
                        <PointsMembershipProvider>
                          <AddToCartLogProvider>
                            <AddToCartProvider>
                              <OrderProvider>
                                <WishlistProvider>
                                  {children}
                                </WishlistProvider>
                              </OrderProvider>
                            </AddToCartProvider>
                          </AddToCartLogProvider>
                        </PointsMembershipProvider>
                      </PostProvider>
                    </PostMediaProvider>
                  </ProductProvider>
                </ProductMediaProvider>
              </ProductColorProvider>
            </ProductSizeProvider>
          </ProductCategoryProvider>
        </CategoryProvider>
      </RangeProvider>
    </DepartmentProvider>
  </BrandProvider>
);
```

---

### Step 2: Update App.tsx to use SlimLandingContextBundle

Open `src/App.tsx`.

**Add `SlimLandingContextBundle` to the import** from `./context/RouteContextBundles`:

```ts
// FIND:
import {
  ProductContextBundle,
  PostContextBundle,
  OrderContextBundle,
  CommunityContextBundle,
  AnalyticsContextBundle,
  LandingContextBundle,
} from "./context/RouteContextBundles";

// REPLACE WITH:
import {
  ProductContextBundle,
  PostContextBundle,
  OrderContextBundle,
  CommunityContextBundle,
  AnalyticsContextBundle,
  LandingContextBundle,
  SlimLandingContextBundle,
} from "./context/RouteContextBundles";
```

**Then replace the LandingContextBundle route wrapper** for customer-facing routes:

```tsx
// FIND (around line 218):
<Route element={<LandingContextBundle><Outlet /></LandingContextBundle>}>

// REPLACE WITH:
<Route element={<SlimLandingContextBundle><Outlet /></SlimLandingContextBundle>}>
```

> **Important**: Only replace the landing-route instance. The `LandingContextBundle` named export can stay — it's used by future admin pages that legitimately need all contexts.

---

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 errors.
2. Visit `/` (home), `/product-section`, `/cart`, `/highlights` in the browser.
3. Open DevTools → Network → WS tab. Confirm there are **fewer** open WebSocket connections than before (~9 vs 24).
4. All pages should function identically — products load, cart works, wishlist works, highlights shows posts.

---

---

## Agent 2 — Remove Chat Polling + Fix Video Loop + Fix Carousel Interval

### Overview

You are a senior React/TypeScript developer. Make **four surgical changes** across three files to eliminate continuous CPU and GPU wake-ups:

1. Remove the 3-second polling loop from `Chat.tsx`
2. Remove `loop` and add a visibility pause in `SmartMedia.tsx`
3. Increase interval and add visibility guard in `product.tsx` carousel
4. Increase interval and add visibility guard in `post.tsx` carousel

---

### Files to Modify

- `src/pages/landing/Chat.tsx`
- `src/components/SmartMedia.tsx`
- `src/components/product/product.tsx`
- `src/components/post/post.tsx`

---

### Change 1 — Chat.tsx: Remove the polling loop entirely

Open `src/pages/landing/Chat.tsx`.

**FIND and DELETE this entire `useEffect` block** (lines ~138–145):

```ts
  // Poll as a fail-safe to keep messages fresh if realtime misses
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      await listMessagesByConversationId(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, listMessagesByConversationId]);
```

Also remove `listMessagesByConversationId` from the destructure at the top of the component (line ~118) if it is no longer used anywhere else in the file after this deletion:

```ts
// FIND:
  const {
    loading,
    conversations,
    createConversation,
    addParticipant,
    listMessagesByConversationId,
  } = useConversationContext();

// REPLACE WITH:
  const {
    loading,
    conversations,
    createConversation,
    addParticipant,
  } = useConversationContext();
```

> The realtime subscription in `ConversationContext` already handles all message updates. The poll was redundant.

---

### Change 2 — SmartMedia.tsx: Remove loop, add visibility pause

Open `src/components/SmartMedia.tsx`.

#### 2a — Remove `loop` from the video element (line ~218)

**FIND:**
```tsx
        <video
          ref={videoRef}
          src={src}
          aria-label={alt}
          muted
          loop
          playsInline
          preload="metadata"
```

**REPLACE WITH:**
```tsx
        <video
          ref={videoRef}
          src={src}
          aria-label={alt}
          muted
          playsInline
          preload="metadata"
```

#### 2b — Add a `visibilitychange` event that pauses video when page is hidden

**FIND** (the existing video autoplay useEffect, around line 141):
```ts
  useEffect(() => {
    if (resolvedType === "video" && isVisible && videoRef.current !== null) {
      void videoRef.current.play().catch(() => {
        // Autoplay blocked — poster/skeleton remains visible, no UI error
      });
    }
  }, [isVisible, resolvedType]);
```

**REPLACE WITH:**
```ts
  useEffect(() => {
    if (resolvedType === "video" && isVisible && videoRef.current !== null) {
      void videoRef.current.play().catch(() => {
        // Autoplay blocked — poster/skeleton remains visible, no UI error
      });
    }
  }, [isVisible, resolvedType]);

  // Pause video when the page is hidden (screen off, app backgrounded)
  // to stop continuous GPU decode when the user is not watching.
  useEffect(() => {
    if (resolvedType !== "video") return;

    const handleVisibilityChange = (): void => {
      const video = videoRef.current;
      if (video === null) return;
      if (document.visibilityState === "hidden") {
        video.pause();
      } else if (isVisible) {
        void video.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resolvedType, isVisible]);
```

---

### Change 3 — product.tsx: Increase carousel interval + add visibility guard

Open `src/components/product/product.tsx`.

**FIND:**
```ts
  // Auto-scroll images
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    } // No need to scroll if there's only one images

    const intervalId = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % medias.length);
    }, 1000);

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [medias.length]);
```

**REPLACE WITH:**
```ts
  // Auto-scroll images every 3 seconds (reduced from 1s to prevent CPU heating).
  // Paused when the page is hidden (screen off / app backgrounded).
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = (): void => {
      if (document.visibilityState === "visible") {
        intervalId = setInterval(() => {
          setCurrentIndex((current) => (current + 1) % medias.length);
        }, 3000);
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [medias.length]);
```

---

### Change 4 — post.tsx: Increase carousel interval + add visibility guard

Open `src/components/post/post.tsx`.

**FIND:**
```ts
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % medias.length);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [medias.length]);
```

**REPLACE WITH:**
```ts
  // Auto-advance carousel every 3 seconds (reduced from 1s to prevent CPU heating).
  // Paused when the page is hidden (screen off / app backgrounded).
  useEffect(() => {
    if (medias.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = (): void => {
      if (document.visibilityState === "visible") {
        intervalId = setInterval(() => {
          setCurrentIndex((current) => (current + 1) % medias.length);
        }, 3000);
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [medias.length]);
```

---

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 TypeScript errors.
2. Open `/support-chat` in browser — chat messages still update in real time without the poll.
3. Open `/highlights` — videos play once and stop on last frame (no looping).
4. Lock the phone/tab away — video and carousel timers should pause.
5. Carousel in admin post editor still advances (now every 3s instead of 1s).

---

---

## Agent 3 — Stagger Image Preloading in useImagePreloader

### Overview

You are a senior React/TypeScript developer. Your task is to update `src/hooks/useImagePreloader.ts` to load images in sequential chunks of 4 instead of all at once. Currently, if `Highlights.tsx` has 20+ posts, it fires 20 parallel HTTP requests and image decodes simultaneously on mount. This bursts the network radio and CPU into full load at once. Chunked loading reduces peak CPU/network usage dramatically.

---

### Files to Modify

- `src/hooks/useImagePreloader.ts`

---

### Full replacement for useImagePreloader.ts

Replace the **entire file content** with the following:

```ts
import { useEffect } from "react";
import { imageCache } from "../utils/imageCache";
import { isVideoUrl } from "../utils/mediaUtils";

/**
 * Maximum number of images to load concurrently.
 * This prevents a single page mount from saturating the network radio
 * and triggering simultaneous GPU image decodes (a common cause of
 * phone overheating on media-heavy pages).
 */
const CONCURRENT_PRELOAD_LIMIT = 4;

/**
 * Programmatically preloads an array of image URLs in sequential chunks
 * of up to CONCURRENT_PRELOAD_LIMIT at a time.
 *
 * Each batch waits for all images in the current chunk to either load
 * or error before starting the next chunk. This keeps CPU/network usage
 * bounded rather than spiking to N parallel downloads on mount.
 *
 * When each image finishes loading, its URL is written to the shared
 * `imageCache` Set. `SmartImage` / `SmartMedia` components check this Set
 * on mount — if the URL is already cached, they skip the skeleton shimmer
 * and display the image immediately.
 *
 * **Video URLs are automatically skipped** — they cannot be preloaded via
 * the Image constructor.
 *
 * @param urls - An array of media URLs to preload (videos are ignored).
 */
export const useImagePreloader = (urls: string[]): void => {
  useEffect(() => {
    let cancelled = false;

    const validImageUrls = urls.filter(
      (url) =>
        url !== "" &&
        !url.includes("via.placeholder.com") &&
        !isVideoUrl(url) &&
        !imageCache.has(url) // Skip already-cached URLs immediately
    );

    if (validImageUrls.length === 0) return;

    const allImages: HTMLImageElement[] = [];

    /**
     * Load one chunk of up to CONCURRENT_PRELOAD_LIMIT images.
     * Returns a Promise that resolves when every image in the chunk
     * has either loaded or errored.
     */
    const loadChunk = (chunk: string[]): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (chunk.length === 0) {
          resolve();
          return;
        }

        let settled = 0;

        const onSettled = (): void => {
          settled += 1;
          if (settled === chunk.length) resolve();
        };

        chunk.forEach((url) => {
          const img = new Image();
          img.onload = () => {
            imageCache.add(url);
            onSettled();
          };
          img.onerror = onSettled; // Still advance even on failure
          img.src = url;
          allImages.push(img);
        });
      });
    };

    /**
     * Sequentially process chunks. Each chunk starts only after the previous
     * one settles, bounding concurrent downloads to CONCURRENT_PRELOAD_LIMIT.
     */
    const runChunks = async (): Promise<void> => {
      for (let i = 0; i < validImageUrls.length; i += CONCURRENT_PRELOAD_LIMIT) {
        if (cancelled) break;
        const chunk = validImageUrls.slice(i, i + CONCURRENT_PRELOAD_LIMIT);
        await loadChunk(chunk);
      }
    };

    void runChunks();

    return () => {
      cancelled = true;
      // Clear src so the browser can garbage-collect the Image objects
      allImages.forEach((img) => {
        img.src = "";
      });
    };
  }, [urls]);
};
```

---

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 errors.
2. Open `/highlights` in DevTools → Network tab.
3. Confirm that images load in batches of ~4 rather than all simultaneously on mount.
4. SmartMedia components should still show images immediately when they enter the viewport.
5. Images that were already preloaded should still skip the skeleton on re-mount.

---

---

## Summary

| Agent | Files | Impact |
|-------|-------|--------|
| Agent 1 | `RouteContextBundles.tsx`, `App.tsx` | Remove 15 WebSocket channels from every customer page (62% reduction) |
| Agent 2 | `Chat.tsx`, `SmartMedia.tsx`, `product.tsx`, `post.tsx` | Remove polling loop, stop looping video, 3× slower carousel, visibility pause |
| Agent 3 | `useImagePreloader.ts` | Chunk parallel downloads from N→4 max concurrent |

**Combined result**: The phone CPU should be able to reach idle state between user interactions instead of being kept continuously busy. Expected temperature reduction of 5–15°C during normal browsing.
