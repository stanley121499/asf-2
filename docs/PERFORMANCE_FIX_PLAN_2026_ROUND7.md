# Performance Fix Plan — Round 7 (2026): Phone Heating

**Status**: Ready for Implementation  
**Audit Date**: March 14, 2026  
**Focus**: WebView CPU/GPU overload causing phone to overheat  
**Companion Docs**: `PERFORMANCE_FIX_PLAN_2026_ROUND6.md`, `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND7.md`

---

## Root Cause Analysis

A WebView phone overheating means the CPU and/or GPU is being kept **continuously busy** — never falling idle. Five independent causes were found that compound each other:

---

### 🔴 CRITICAL — Cause 1: 24 Simultaneous WebSocket Channels on Every Customer Page

**Files**: `src/context/RouteContextBundles.tsx`

`LandingContextBundle` (which wraps **every single customer-facing route** — home, product section, cart, checkout, highlights, etc.) mounts **all three context bundles at once**:

| Bundle | Channels |
|--------|----------|
| `ProductContextBundle` | BrandContext, DepartmentContext, RangeContext, CategoryContext, ProductCategoryContext, ProductSizeContext, ProductColorContext, ProductMediaContext, ProductFolderMediaContext, ProductFolderContext, ProductEventContext, ProductStockLogContext, ProductStockContext, ProductContext, ProductPurchaseOrderContext = **15 channels** |
| `PostContextBundle` | PostMediaContext, PostFolderMediaContext, PostFolderContext, PostContext = **4 channels** |
| `OrderContextBundle` | AddToCartLogContext, CartContext, OrderContext, PaymentContext, WishlistContext = **5 channels** |

**Total: 24 persistent Supabase WebSocket subscriptions open simultaneously on every customer page.**

A customer browsing `/` (the home page) to look at categories triggers 24 WebSocket connections. Most are completely irrelevant to what they're doing:
- `ProductFolderMediaContext`, `ProductFolderContext`, `ProductStockLogContext`, `ProductStockContext`, `ProductEventContext`, `ProductPurchaseOrderContext` — these are **admin stock management** contexts that a customer will **never use**.
- `PostFolderMediaContext`, `PostFolderContext` — folder management, only needed in the admin post editor.
- `PaymentContext` — only needed on the payments page (admin).
- `AddToCartLogContext` — logging, not needed on most landing pages.

Each channel maintains: a persistent WebSocket connection, a ping/pong keepalive heartbeat, and an event listener on every DB change for the subscribed table. **24 channels = 24 heartbeats + 24 table listeners running continuously, preventing the CPU from sleeping.**

**Fix**: Create a slimmer `SlimLandingContextBundle` for customer routes that includes only what customers actually need, and move admin-only contexts to admin routes only.

**Customer pages actually need:**
- Products: `BrandContext`, `DepartmentContext`, `RangeContext`, `ProductContext`, `ProductMediaContext`, `ProductSizeContext`, `ProductColorContext`, `ProductCategoryContext`, `CategoryContext`
- Posts (home/highlights): `PostContext`, `PostMediaContext`  
- Cart/Orders: `AddToCartLogContext`, `CartContext`, `OrderContext`, `WishlistContext`
- Points: `PointsMembershipContext` (already not subscribing via realtime)

**Customer pages do NOT need:**
- `ProductFolderContext`, `ProductFolderMediaContext` (admin upload only)
- `ProductStockContext`, `ProductStockLogContext`, `ProductEventContext` (stock admin only)
- `ProductPurchaseOrderContext` (purchase orders — admin only)
- `PostFolderContext`, `PostFolderMediaContext` (admin post editor only)
- `PaymentContext` (admin payments only)
- `AddToCartLogContext` (logging — can be lazy)

**Reduction: from 24 channels → ~12 channels on customer pages. That is a 50% reduction in persistent connections.**

---

### 🔴 CRITICAL — Cause 2: 3-Second Polling Loop on Top of Realtime (Chat)

**File**: `src/pages/landing/Chat.tsx`, lines 138–145

```ts
// Fires a Supabase DB query every 3 seconds indefinitely while chat is open
const interval = setInterval(async () => {
  await listMessagesByConversationId(conversationId);
}, 3_000);
```

`ConversationContext` already subscribes to `postgres_changes` on the messages table via realtime. **The polling is completely redundant** — it was added as a "fail-safe" comment but in practice it:
- Fires a full round-trip DB query to Supabase every 3 seconds
- Wakes the CPU from any idle state every 3 seconds
- Keeps the network radio active continuously
- On mobile, prevents the device from entering any low-power state

**Fix**: Remove the `setInterval` polling entirely. Trust the realtime subscription. If a message is missed (rare), the user can pull-to-refresh. If a reliability backstop is truly needed, increase the interval to 30–60 seconds minimum.

---

### 🟠 HIGH — Cause 3: 1-Second Carousel Auto-Advance Timer (Admin Preview Components)

**Files**: `src/components/product/product.tsx` (line 36), `src/components/post/post.tsx` (line 74)

Both admin preview components run a `setInterval` at **1000ms** to auto-advance a media carousel:

```ts
const intervalId = setInterval(() => {
  setCurrentIndex(current => (current + 1) % medias.length);
}, 1000); // fires every second, causing a React re-render every second
```

This causes a forced React re-render **once per second** for as long as the component is mounted. On a phone, this means the JavaScript engine (V8/JavaScriptCore), React reconciler, and layout engine are all woken up every second to process a state change and repaint a frame.

These are used in `post-editor.tsx` (admin only), so actual customers shouldn't encounter them — **but if any customer-facing page ever accidentally renders these**, it would cause severe heating. Additionally, even on admin screens, 1 second is unnecessarily aggressive.

**Fix**: Increase interval to 3000ms (3 seconds) minimum. Stop the interval when the component is not visible (using `document.visibilityState`).

---

### 🟠 HIGH — Cause 4: Looping Auto-Play Videos (SmartMedia + PostComponent)

**Files**: `src/components/SmartMedia.tsx` (line 218–219), `src/components/post/post.tsx` (line 132–134)

Both components use `loop` + `muted` + `autoPlay` on `<video>` elements:

```tsx
<video muted loop playsInline preload="metadata" ... />
```

A `loop`ing video **never stops decoding frames**. The GPU hardware decoder is engaged continuously to decode compressed video frames, convert color space (YUV → RGB), and composite the result into the page. On a phone WebView this is the single highest GPU load possible from a web page. If the Highlights page has multiple video posts, **multiple simultaneous hardware decoders** are running.

**Fix**:
- Remove `loop` from `SmartMedia.tsx` — editorial hero videos should play once and stop on the last frame.
- Add `preload="none"` instead of `preload="metadata"` for below-fold items — don't even buffer until intersection.
- In `SmartMedia`, pause the video when `document.visibilityState === "hidden"` (page backgrounded or screen off) and resume on `visibilitychange`.

---

### 🟡 MEDIUM — Cause 5: Bulk Parallel Image Preloading on Highlights Mount

**File**: `src/hooks/useImagePreloader.ts`, called from `src/pages/landing/Highlights.tsx`

`Highlights.tsx` calls `useImagePreloader(preloadUrls)` with **all post image URLs** at once on mount:

```ts
// Creates N hidden Image objects simultaneously — all fire network requests in parallel
validImageUrls.forEach(url => {
  const img = new Image();
  img.src = url; // Immediately starts downloading
  images.push(img);
});
```

If there are 20 posts on the Highlights page, this fires **20 simultaneous image download requests** the moment the page mounts. On a phone:
- Saturates the network radio (4G/WiFi chip stays fully active)
- Forces image decode on the CPU/GPU for each completed download
- Competes with the actual visible images the user is looking at

**Fix**: Limit concurrent preloads to a maximum of 4–6 at a time using a sequential/chunked approach instead of firing all at once. Prioritize the first 2 images (above-fold) as eager, then drip-feed the rest.

---

### 🔵 LOW — Cause 6: Continuous `animate-pulse` CSS Animation During Loading

**Files**: `Highlights.tsx`, `SmartMedia.tsx`, `home.tsx`, `ProductSection.tsx`, `SmartImage.tsx`

Every skeleton uses `animate-pulse`, which is a CSS `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`. While a single animation is cheap, during the loading phase **every image and media element on the page** shows a pulsing skeleton simultaneously — this can be **8–20 concurrent CSS animations** each requiring GPU compositing every 16ms (60fps).

These are all correctly removed once content loads, so this is a transient issue, not a continuous one. The impact is during the first 1–3 seconds of page load when the network is slowest.

**Fix**: Use `animation-delay` offsets on skeletons to stagger them slightly, preventing all from being in their peak opacity state simultaneously. For very long-loading skeletons, consider a static gray placeholder instead of pulsing.

---

## Priority Summary

| Priority | Cause | Estimated Heat Reduction |
|----------|-------|--------------------------|
| 🔴 #1 | 24 WebSocket channels → reduce to ~9 | Very High — eliminates background CPU wake |
| 🔴 #2 | Remove 3s chat polling loop | High — eliminates 20/min CPU wake cycles |
| 🟠 #3 | 1s carousel interval → 3s + visibility gate | Medium — 3× fewer re-renders |
| 🟠 #4 | Video `loop` removal + visibility pause | High — eliminates continuous GPU decode |
| 🟡 #5 | Stagger image preloading | Medium — reduces network/CPU burst on mount |
| 🔵 #6 | Stagger `animate-pulse` animations | Low — transient, loading phase only |

---

## Agent Task Breakdown

### Agent 1 — Slim LandingContextBundle (Most Impactful)

Create a `SlimLandingContextBundle` in `RouteContextBundles.tsx` with only customer-needed contexts and update `App.tsx` to use it for all landing routes.

**Files**: `src/context/RouteContextBundles.tsx`, `src/App.tsx`

---

### Agent 2 — Remove Chat Polling + Fix Video Loop + Carousel Interval

Three surgical changes:

1. **Remove** the `setInterval` polling from `src/pages/landing/Chat.tsx` (lines 138–145)
2. **Remove `loop`**, switch to `preload="none"` for non-eager, and **add visibility-pause** in `src/components/SmartMedia.tsx`
3. **Increase interval** from 1000ms to 3000ms and **add `visibilitychange` guard** in `src/components/product/product.tsx` and `src/components/post/post.tsx`

---

### Agent 3 — Stagger Image Preloading in useImagePreloader

Update `src/hooks/useImagePreloader.ts` to load images in sequential chunks of 4 instead of all at once.

**Files**: `src/hooks/useImagePreloader.ts`
