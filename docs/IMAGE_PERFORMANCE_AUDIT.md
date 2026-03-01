# Image Loading Performance Audit

**Date:** March 2026  
**Auditor:** Senior Developer Review  
**Trigger:** User-reported symptom — "the whole part will be white, then BAM, all loads in at once"

---

## Executive Summary

A full app-wide audit of every `<img>` tag across the React codebase revealed that **zero images** in the entire application use any form of lazy loading, skeleton placeholders, or loading prioritisation. The browser fetches all images simultaneously on page render regardless of whether they are visible, causing the network to saturate, the affected section to stay blank white, and then everything to paint at once when the last request resolves. This is a systemic issue affecting every page in the application that renders user-generated or remote images.

Additionally, several pages use the `flatMap(Array(N).fill(null).map(...))` render anti-pattern which inflates the rendered image count by an order of magnitude, and many perform linear `O(N)` media lookups inside JSX loops, further delaying the moment images are first requested.

Because the project is on the Supabase **Free plan**, server-side image transformation is unavailable. All fixes are front-end only.

---

## Issues Found

---

### ISSUE 1 — Missing `loading="lazy"` on All `<img>` Tags

**Severity:** 🔴 Critical  
**Affects:** Entire application (36+ `<img>` tags)

**Description:**  
The native HTML `loading` attribute is absent from every `<img>` tag in the codebase. By default, all images are `loading="eager"`, meaning the browser schedules download for every image the moment it parses the DOM — including images that are far below the viewport fold. This causes a simultaneous burst of network requests on page load, saturating the browser's HTTP/2 connection pool (typically 6–8 parallel connections per origin). Images wait in a queue, the containers stay white, and then all resolve together.

**Files Affected:**
- `src/pages/landing/Highlights.tsx` — 13 `<img>` tags (hero banners + grid sections)
- `src/pages/landing/home.tsx` — 3 `<img>` tags in product/post card loops
- `src/pages/landing/Cart.tsx` — product images per cart item
- `src/pages/landing/Wishlist.tsx` — product images per wishlist item
- `src/components/home/HomeHighlightsCard.tsx` — reusable card, used in bulk (20+ instances per row)
- `src/components/product/CategoryPreviewSidebar.tsx` — category navigation images
- `src/pages/products/category-page.tsx` — department, range, brand thumbnails (16+ images)
- `src/pages/stocks/list.tsx` — product thumbnail per row
- `src/pages/stocks/overview.tsx` — product thumbnail per event row
- `src/pages/stocks/good-stocks.tsx` — product thumbnails in two list sections
- `src/pages/stocks/event-list.tsx` — product thumbnail per event
- `src/components/analytics/ListWidget.tsx` — product media in analytics widgets
- `src/components/analytics/ListPage.tsx` — product media in analytics list
- `src/pages/landing/components/Category.tsx` — product images in category scroll
- `src/pages/landing/components/Product.tsx` — single product hero image
- `src/components/home/overlay-cards-with-zoom-effect.tsx` — 6 hardcoded external images
- `src/components/home/cards-with-grid-layout-and-CTA.tsx` — 12 hardcoded external images
- `src/pages/support/CommunityView.tsx` — community and group avatars
- `src/pages/support/chat-window.tsx` — image attachment previews
- `src/pages/internal-chat/index.tsx` — illustration image

**Problematic Pattern:**
```tsx
// Every <img> across the app looks like this — no loading attribute:
<img
  src={productMedia?.media_url || fallback}
  alt={product.name}
  className="w-full h-full object-cover"
/>
```

**Fix:**  
Add `loading="lazy"` and `decoding="async"` to all below-fold images. Mark above-fold LCP hero images with `fetchpriority="high"` and `loading="eager"` explicitly. The best approach is a centralised `<LazyImage>` component (see Issue 3) so this is enforced by default across the entire app.

---

### ISSUE 2 — No Skeleton / Shimmer Placeholder During Image Load

**Severity:** 🔴 Critical  
**Affects:** All image-heavy pages

**Description:**  
When an image is loading, the container (`div.h-48.bg-gray-100` etc.) shows a flat grey background with no animation. There is no shimmer effect, no blur-up placeholder, and no progressive reveal. The user sees static blank space that looks like a broken layout. This is the direct cause of the "white flash then BAM" experience: the section renders structurally correct HTML with grey boxes, then images pop in all at once with no visual continuity.

Top-tier e-commerce apps (Shopify, ASOS, Zalando) use animated shimmer skeletons that give users instant visual feedback that content is loading, preventing perceived blank/broken states.

**Problematic Pattern:**
```tsx
// HomeHighlightsCard.tsx — grey box with no animation while image loads
<div className="h-48 bg-gray-100 relative">
  <img
    src={resolvedImageUrl}
    alt={resolvedAlt}
    className="w-full h-full object-cover"
  />
</div>
```

**Fix:**  
Replace the static background with an animated shimmer via Tailwind's `animate-pulse` on the wrapper. Use the `onLoad` event on `<img>` to fade the image in once it is ready (`opacity-0` → `opacity-100` via CSS transition). This hides the shimmer when the image arrives and creates a smooth progressive reveal instead of a jarring pop.

---

### ISSUE 3 — No Reusable `<LazyImage>` Component Exists

**Severity:** 🔴 Critical  
**Affects:** Architecture — causes Issues 1 and 2 to be pervasive

**Description:**  
There is no shared image component in the codebase. Every file implements its own bare `<img>` tag, meaning every optimisation (lazy loading, skeleton, error fallback, fade-in) would need to be replicated manually across 36+ locations. This also means there is no single place to enforce standards or make future improvements.

**Fix:**  
Create `src/components/ui/LazyImage.tsx` — a reusable component that:
1. Renders an animated shimmer skeleton at the correct dimensions while the image is in-flight
2. Applies `loading="lazy"` and `decoding="async"` by default
3. Accepts an optional `fetchpriority` prop (`"high"` | `"low"` | `"auto"`) for LCP/hero images
4. Fades the image in on `onLoad` (opacity transition) for a smooth reveal
5. Falls back to a configurable fallback image on `onError`, preventing broken image icons
6. Accepts all standard `<img>` props via TypeScript spreading

Once this component exists, all other fixes become a mechanical find-and-replace of `<img>` → `<LazyImage>`.

---

### ISSUE 4 — No `fetchpriority` on LCP Hero Images

**Severity:** 🟠 High  
**Affects:** `Highlights.tsx`, `home.tsx`

**Description:**  
The large hero banner images on the Highlights page and the home page are the Largest Contentful Paint (LCP) elements — the primary metric Google and users use to judge perceived page speed. These images are currently treated the same as a 64×64 thumbnail in a stock list. The browser's preload scanner does not know which image to prioritise, so it processes them in DOM order mixed with all other images.

`fetchpriority="high"` is a native HTML attribute (supported in all modern browsers) that signals to the browser's preload scanner to fetch this specific resource before others. Combined with `loading="eager"` on the above-fold hero, this can improve LCP scores by 30–60%.

**Problematic Pattern (Highlights.tsx):**
```tsx
// Hero image — largest element on page, but treated identically to a thumbnail
<img 
  src={featuredPosts[0].medias?.[0]?.media_url || "..."} 
  alt="Featured Collection" 
  className="w-full h-[75vh] object-cover"
/>
```

**Fix:**  
Add `fetchpriority="high"` and `loading="eager"` to the first hero image on `Highlights.tsx` and on `home.tsx`. All subsequent images should use `loading="lazy"`.

---

### ISSUE 5 — O(N×M) Linear Media Scans Blocking Image Render

**Severity:** 🟠 High  
**Affects:** `Highlights.tsx`, `home.tsx`, `landing/components/Category.tsx`, `stocks/list.tsx`, `stocks/overview.tsx`, `stocks/good-stocks.tsx`, `stocks/event-list.tsx`

**Description:**  
Before images can even be requested, the browser must execute JavaScript to resolve each image's `src`. Multiple pages do this by calling `Array.find()` or `Array.filter()` inside JSX render — once per image, scanning the full `productMedias` or `postMedias` arrays each time. With 100 products and 100 media records, each render fires 100 × 100 = 10,000 comparisons just to resolve image sources.

This synchronous JavaScript work **blocks the render thread** and delays the moment the browser even starts requesting images.

**Worst Offender — `Highlights.tsx`:**
```tsx
// Called 13 separate times in JSX, each scanning the full postMedias array:
postMedias.find(media => media.post_id === featuredPosts[N].id)?.media_url
```

**Worst Offender — `landing/components/Category.tsx`:**
```tsx
// Inside a flatMap(Array(10)) loop — runs 10× per product:
productMedias.find(
  (media) => media.product_id === product.id
)?.media_url
```

**Fix:**  
Pre-build a `Map<string, string>` (id → media_url) via `useMemo` at the top of each component. Replace all `.find()` calls with `O(1)` Map lookups:
```tsx
const postMediaMap = useMemo(
  () => new Map(postMedias.map(m => [m.post_id, m.media_url])),
  [postMedias]
);
// Then in JSX:
src={postMediaMap.get(post.id) ?? fallbackUrl}
```

---

### ISSUE 6 — `flatMap(Array(N).fill(null))` Anti-Pattern Inflating Image Count

**Severity:** 🟠 High  
**Affects:** `landing/components/Category.tsx`, `stocks/list.tsx`, `stocks/overview.tsx`, `stocks/good-stocks.tsx`, `stocks/event-list.tsx`

**Description:**  
Multiple pages use `array.flatMap(item => Array(10).fill(null).map(...))` to render items. This multiplies the number of rendered DOM nodes (and image requests) by 10. For example, if there are 20 products in stock view, this renders 200 product cards — each with its own `<img>` tag — firing 200 simultaneous image requests instead of 20.

This is a pre-existing anti-pattern documented in the general performance audit, but it is compounded by the lack of lazy loading: all 200 images are requested simultaneously.

**Problematic Pattern (Category.tsx):**
```tsx
{productsByCategory.flatMap((product) =>
  Array(10)
    .fill(null)
    .map((_, index) => (
      <div key={`${product.id}-${index}`}>
        <img src={productMedias.find(...)} alt={product.name} />
      </div>
    ))
)}
```

**Fix:**  
Replace `flatMap(Array(10)...)` with a simple `.map()`. Each product should render exactly one card. This directly reduces the number of image requests by 10×.

---

### ISSUE 7 — No `onError` Fallback Handling on Most Images

**Severity:** 🟡 Medium  
**Affects:** All `<img>` tags that consume Supabase Storage URLs

**Description:**  
When a Supabase Storage image URL is invalid, expired, or returns a network error, most `<img>` tags have no `onError` handler. The browser displays a broken image icon. This also triggers silent retries in some browsers, wasting additional network bandwidth and potentially causing layout shifts.

**Fix:**  
The `<LazyImage>` component (Issue 3) should include an `onError` handler that swaps the `src` to a configurable fallback URL, preventing broken icons entirely.

---

### ISSUE 8 — Hardcoded External Images with No Lazy Loading or Dimensions

**Severity:** 🟡 Medium  
**Affects:** `components/home/cards-with-grid-layout-and-CTA.tsx`, `components/home/overlay-cards-with-zoom-effect.tsx`

**Description:**  
These two Flowbite template components contain **12 and 6 hardcoded cross-origin image URLs** respectively, all hosted on `flowbite.s3.amazonaws.com`. None have `loading="lazy"`, `decoding="async"`, or `width`/`height` attributes. Since their dimensions are not declared, the browser cannot calculate layout until each image loads, causing Cumulative Layout Shift (CLS). All 18 images fire simultaneously on any page that includes these components.

**Fix:**  
Add `loading="lazy"`, `decoding="async"`, and explicit `width`/`height` attributes to all `<img>` tags in these components. As they are Flowbite template files that do not receive dynamic data, they do not need the full `<LazyImage>` treatment — native HTML attributes are sufficient.

---

### ISSUE 9 — Missing DNS Preconnect Hints for Image Origins

**Severity:** 🟡 Medium  
**Affects:** `public/index.html`

**Description:**  
The `public/index.html` file contains no `<link rel="preconnect">` or `<link rel="dns-prefetch">` hints for the domains from which the app loads images. This means the browser must perform a full DNS resolution + TCP connection + TLS handshake for each origin the first time an image from that origin is requested. For Supabase Storage (which powers all product/post media) this can add 100–300ms of latency to the first image in every batch.

**Affected Origins:**
- Supabase Storage: `https://gswszoljvafugtdikimn.supabase.co`
- Flowbite CDN: `https://flowbite.s3.amazonaws.com`
- Placeholder service: `https://via.placeholder.com`

**Fix:**  
Add `<link rel="preconnect">` tags to `public/index.html` for each domain. This instructs the browser to initiate the connection during the HTML parse phase, long before the first image request fires.

---

## Summary Table

| # | Issue | Severity | Files Affected |
|---|---|---|---|
| 1 | No `loading="lazy"` on any `<img>` | 🔴 Critical | 20+ files |
| 2 | No skeleton/shimmer placeholder | 🔴 Critical | All image pages |
| 3 | No reusable `<LazyImage>` component | 🔴 Critical | Architecture |
| 4 | No `fetchpriority` on LCP hero images | 🟠 High | `Highlights.tsx`, `home.tsx` |
| 5 | O(N×M) linear media scans blocking render | 🟠 High | 7 files |
| 6 | `flatMap(Array(N))` inflating image count | 🟠 High | 5 files |
| 7 | No `onError` fallback on images | 🟡 Medium | All dynamic image files |
| 8 | Hardcoded external images, no attributes | 🟡 Medium | 2 component files |
| 9 | No DNS preconnect hints in `index.html` | 🟡 Medium | `public/index.html` |

---

## Out of Scope

- **Supabase Storage image transforms** (resize/quality URL params) — the project is on the **Free plan** and this feature requires the Pro plan. Skipped entirely.
- **WebP/AVIF format conversion** — not supported without a paid CDN or server-side processing.
- **Progressive JPEG / LQIP (Low Quality Image Placeholders)** — requires server-side image processing, not available on Free plan.
