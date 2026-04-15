# Customer App — Bug Fix Agent Prompts (Round 2, March 2026)

Run agents **in order**. Each is self-contained. Read root constraints from `docs/CUSTOMER_REDESIGN_PLAN_2026.md` before starting.

**Quick rules reminder:**
- No `any`, no `!` assertions, double quotes, complete files
- 100% Simplified Chinese for all user-visible strings
- No `router.back()` — but see Issue 6 below for the correct back-nav pattern
- Run `npx tsc --noEmit` after every agent and fix all errors

---

## AGENT 1 — Image Performance (Next.js Optimization)

**Issue:** Product images and post images are loading at full size (1–5 MB each), causing slow scroll performance on mobile.

**Files to touch:**
- `asf-2-next/next.config.mjs`
- `asf-2-next/src/components/home/ProductCard.tsx`
- `asf-2-next/src/components/PostCard.tsx` (if it uses `<img>` or `<Image>`)

**Task: next.config.mjs**

Add image optimization settings to the existing `images` block:
```js
images: {
  remotePatterns: [...existing patterns...],
  formats: ["image/webp", "image/avif"],
  deviceSizes: [390, 640, 750, 828, 1080],
  imageSizes: [64, 128, 256, 390],
  minimumCacheTTL: 86400,
}
```

**Task: ProductCard.tsx**

Find the `next/image` `<Image>` component being used for product images. Ensure these props are set correctly:
- `sizes="(max-width: 640px) 50vw, 33vw"` — currently it may be using `100vw` which causes the browser to download a full-width image for a 50%-width card
- `quality={75}` — reduces file size significantly with minimal visible quality loss
- `priority={false}` — lazy load all cards except the first 2. For the first 2 products in the list, set `priority={true}`.
- If the component uses a raw `<img>` tag anywhere instead of `next/image`, replace it with `next/image`.

**Task: PostCard.tsx**

Same as ProductCard. Find the image/video rendering:
- For images: use `next/image` with `sizes="100vw"` (posts are full-width) and `quality={80}`
- For videos (`<video>` tags): add `preload="none"` and `playsInline` attributes. Do NOT autoplay videos at full quality. Add a `poster` attribute using the first frame (if available as a separate field) or a fallback placeholder.
- If the post media is a video URL (check `media_type` field or check if URL ends in `.mp4`/`.mov`/`.webm`), render a `<video>` with `controls`, `playsInline`, `preload="none"`, and `muted`. Do NOT use `next/image` for video URLs.

**Verification:** Hot reload. Scroll through product catalog — images should appear progressively but at correct sizes. Open browser DevTools (Network tab) and confirm image responses are WebP and under 200KB for mobile viewport.

---

## AGENT 2 — Navigation Back Button System (Context-Aware Back)

**Issue:** Currently back buttons are hardcoded to wrong routes. E.g. notifications always go back to `/settings` regardless of where the user came from. The constraint is: we cannot use `router.back()` for WebView safety, but we also can't hardcode a single "previous route" because users reach the same screen from different places.

**Solution: Use a `?from=` query string parameter** to track the originating route. Every navigation that opens a secondary screen appends `?from=/current-path`. The secondary screen reads `searchParams.get('from')` and uses that as its back destination. If `from` is missing, fall back to a sensible default.

**Files to touch:**
- `asf-2-next/src/components/navbar-home.tsx` — update bell icon link
- `asf-2-next/src/app/(customer)/notifications/page.tsx` — read `from` param
- `asf-2-next/src/app/(customer)/wishlist/page.tsx` — fix back route (currently goes to `/my`)
- `asf-2-next/src/app/(customer)/goal/page.tsx` — fix back route
- `asf-2-next/src/app/(customer)/support-chat/page.tsx` — fix back route
- `asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx` — verify back route

**Task: navbar-home.tsx**

Find the bell icon button. Change its `onClick` from `router.push('/notifications')` to:
```ts
router.push(`/notifications?from=${encodeURIComponent(pathname)}`)
```
Import `usePathname` from `next/navigation` to get `pathname`. This way, whenever the bell is tapped, the notifications page knows which page to go back to.

**Task: notifications/page.tsx**

1. Add `useSearchParams` import from `next/navigation`.
2. Read `const from = searchParams.get('from') ?? '/'`.
3. Change the back button `onClick` from `router.push('/settings')` to `router.push(from)`.
4. The back button label should still say 「返回」(not the page name, since the page name is dynamic).

**Task: wishlist/page.tsx**

Read the current file fully. Find anywhere the back button uses `router.push('/my')` or `router.back()` or `href="/my"`. 

The wishlist is a **bottom nav tab** — it should NOT have a back button in the top bar at all (it's a root destination). If there is a back button, remove it. The top bar should only show the title 「已收藏」. Navigation out of wishlist is via the bottom nav tabs.

If there is an explicit back route set to `/my`: `/my` does not exist — remove it.

**Task: goal/page.tsx**

Find the back button and ensure it does `router.push('/settings')`. This is correct (goal is always accessed from settings). No change needed here unless it was changed to something else.

**Task: support-chat/page.tsx**

Find the back button (usually in the top bar header). Change it to:
```ts
const from = searchParams.get('from') ?? '/settings';
// back button: router.push(from)
```
Also update the cancel button on the ticket form to use the same `from` value instead of hardcoded `/settings`.

Import `useSearchParams` if not already imported.

**Task: settings/page.tsx**

Find the link/button that navigates to `/support-chat`. Change it from `router.push('/support-chat')` to:
```ts
router.push(`/support-chat?from=${encodeURIComponent('/settings')}`)
```

**Task: ProductDetailsClient.tsx**

Find the back button (top-left `←`). Currently it may say `router.push('/product-section')`. Change it to read a `from` param:
```ts
const searchParams = useSearchParams();
const from = searchParams.get('from') ?? '/product-section';
// back button: router.push(from)
```

Also update the ProductCard link in catalog/home to append `?from=/product-section`:
In `ProductCard.tsx`, change the `<Link href={...}>` to include the from param:
```tsx
href={`/product-details/${product.id}?from=${encodeURIComponent('/product-section')}`}
```
And from Home page, the link should use `?from=%2F` (home `/`).

**Verification:** Navigate from home → bell → notifications. Back button should go back to home. Navigate from settings → support chat → back goes to settings. Navigate from catalog → product → back goes to catalog.

---

## AGENT 3 — Loading Page Redesign + Order List Page (New)

### Part A: Loading Page

**Issue:** `src/app/loading.tsx` shows "Give us a moment" (English) + "loading..." (English) + a maintenance SVG that doesn't match the design system.

**File:** `asf-2-next/src/app/loading.tsx`

Replace the entire JSX with a design-system-aligned loading screen:

```
Layout: full-screen centered flex column, bg-[var(--color-bg)] or #FFFFFF
```
Contents:
1. Brand name text in `font-display` serif, 28px, `var(--color-text)`: **「SYSTEM APP FORMULA」**
2. Below it: three animated dots (CSS pulse animation, `--color-accent` color). Use three spans with staggered `animation-delay`:
   - Span 1: 0ms delay
   - Span 2: 150ms delay  
   - Span 3: 300ms delay
   - Each span: `w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce inline-block mx-1`
3. Below dots: small text 「正在加载…」in `var(--color-muted)`, 14px

Remove: the maintenance SVG, all English strings, blue pill badge, dark mode classes.

Also apply the same fix to `src/app/(customer)/loading.tsx` if it exists — it should use the identical component.

### Part B: Orders List Page (New)

**Issue:** Settings links to `/order-details` for "我的订单", but only `/order-details/[orderId]` exists. There is no list page, causing a 404.

**File to create:** `asf-2-next/src/app/(customer)/order-details/page.tsx` — NEW file

This is a simple list page. Read the data from `useAddToCartLogContext` or, more correctly, fetch orders from Supabase. Since we are doing frontend-demo-first:

Use `useAuthContext` to get `user`. Fetch orders from `useAddToCartContext` if it exposes order history, otherwise use mock data.

**Mock data approach (demo):**
```ts
const mockOrders = [
  { id: "ORD-8821", date: "2026-03-18", status: "delivered", total: 89.97, items: 3 },
  { id: "ORD-8742", date: "2026-03-10", status: "shipped", total: 45.00, items: 1 },
  { id: "ORD-8633", date: "2026-02-28", status: "delivered", total: 124.50, items: 4 },
];
```

**Page layout:**
- Top bar: `← 返回` → `router.push('/settings')`. Title: 「我的订单」center.
- If user not logged in: show 「请先登录」+ 「去登录」button → `/authentication/sign-in`.
- Order list: for each order, a card row `card-panel` style:
  - Order ID (bold, `var(--color-text)`)
  - Date (muted, 14px)
  - Status badge: 「已完成」(green), 「已发货」(sand accent), 「待处理」(gray)
  - Total price: `RM{total}` in `var(--color-accent)`
  - Chevron `›` right side
  - Tapping: `router.push(`/order-details/${order.id}`)` (uses the existing detail page)
- Empty state (if no orders): 「暂无订单记录」serif + 「去购物 →」→ `/product-section`
- No bottom nav overlap — add `pb-24` at the end.

**Verification:** `npx tsc --noEmit`. Navigate: Settings → 我的订单 — should land on order list, not 404. Order rows visible. Tapping a row navigates to detail page.

---

## AGENT 4 — Highlights Discovery + Company Name + Top Bar Brand

### Part A: Company Name in Top Bar

**Issue:** Top bar shows "SYSTEM" — should be "SYSTEM APP FORMULA".

**File:** `asf-2-next/src/components/navbar-home.tsx`

Find the brand name text in the top bar (the text that was supposed to replace logo + "SYSTEM APP FORMULA"). Change whatever text is currently rendered to the full string **「SYSTEM APP FORMULA」**. Apply these styles:
- Font: `font-display` (Cormorant Garamond serif)
- Size: `text-lg` (keep it fitting in the top bar)
- Color: `var(--color-text)` — black, NOT orange/yellow/any other color
- Letter spacing: `tracking-wider`

### Part B: Highlights / 精选推荐 Page Discovery

**Issue:** A 26-year-old found it hard to navigate to the Highlights/Posts page. The entry point on the home page is unclear — users don't know the 精选推荐 horizontal strip is tappable or that there's a full feed page.

**File:** `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`

**Change 1 — Section header CTA:**
The 「精选推荐」section header currently has just a title. Add a right-aligned 「查看全部 →」link next to the section title that navigates to `/highlights`. Make it in `var(--color-accent)` color, 14px.

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="font-display text-xl">精选推荐</h2>
  <Link href="/highlights" className="text-[var(--color-accent)] text-sm">查看全部 →</Link>
</div>
```

**Change 2 — Add 精选推荐 to the bottom nav OR clearly label it:**
The bottom nav currently has 首页 / 购物 / 已收藏 / 我的. The highlights page has no direct nav entry. 

Add a visible entry point: on the home page hero, add a **second CTA link** below 「探索新品 →」that says 「精选内容 →」→ `router.push('/highlights')`. This gives users a second explicit path.

**Change 3 — Post card tap area:**
In the horizontal posts strip on home, ensure tapping anywhere on the card (not just an invisible zone) navigates to `/highlights`. Wrap the entire card in a `<Link href="/highlights">` or an `<a onClick>` handler. Add a subtle label: bottom-left of each card, small white text on dark overlay: 「查看全部内容」or a simple 「→」arrow.

### Part C: Fix Post Image / Video Rendering in Home Strip + Highlights Page

**Issue:** The 精选推荐 strip shows a broken image with alt text "Post" visible. Videos on the highlights page don't render well.

**Files:**
- `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx` — home posts strip
- `asf-2-next/src/components/PostCard.tsx` — full post card

**In HomePageClient.tsx — posts strip:**

Find where the post strip renders each post's media. The issue is likely one of:
1. Using `<img src={mediaUrl}>` without handling null/undefined → shows broken alt text
2. Using `next/image` without a valid `src` (empty string breaks it)

Fix: Before rendering the image, check `if (!mediaUrl) render a dark gray placeholder div`. Do NOT render `<Image src="">` — that breaks. Also check if `SmartMedia` or `SmartImage` component is being used — if so, ensure it handles null src gracefully.

For video posts in the strip: do not try to render the video inline in the strip. Instead, show the `poster` image (or first frame), with a small ▶ play icon overlay in the center. The video only plays when the user opens the full highlights page.

**In PostCard.tsx:**

Read the `media_type` field (or check if the URL ends in `.mp4`/`.mov`/`.webm`). 
- If image: use `next/image` with proper error handler (`onError={() => setImgError(true)}`). If error, show gray placeholder div.
- If video: render `<video src={mediaUrl} playsInline muted autoPlay loop preload="metadata" className="w-full h-full object-cover" />`. Note: `preload="metadata"` loads just enough to show first frame without downloading the full file. If the video still doesn't render well, fall back to showing the poster image.

**Verification:** Home page 精选推荐 section shows actual post images (not "Post" alt text). Tapping "查看全部 →" navigates to `/highlights`. Highlights page shows posts with images/videos rendering correctly.

---

## AGENT 5 — Final Cleanup Pass

**Files to touch:**
- All files changed in Agents 1–4
- `asf-2-next/src/app/(customer)/settings/page.tsx`

### Task: Settings — Fix 我的订单 Link

The settings page links to `/order-details` for 「我的订单」. This now works (Agent 3 created the list page), but verify the link is:
```tsx
<Link href="/order-details">我的订单</Link>
// or
router.push('/order-details')
```
NOT `/order-details/[orderId]`. If it's linking to a specific orderId directly, fix it to just `/order-details`.

### Task: Final English String Sweep

Search these files for any remaining English user-visible strings and translate them:

1. `src/components/SearchOverlay.tsx` — trending search tags must be Chinese (already called out in previous audit: "Dresses" → 「连衣裙」, "Summer Collection" → 「夏季新品」, "Basic Tee" → 「基础款T恤」, "Accessories" → 「配饰」, add also 「手袋」and 「运动鞋」)

2. `src/app/(customer)/notifications/page.tsx` — check all notification text is Chinese ✓ (already is)

3. `src/app/(customer)/loading.tsx` — now Chinese after Agent 3 ✓

4. `src/app/loading.tsx` — now Chinese after Agent 3 ✓

### Task: TypeScript Final Pass

Run `npx tsc --noEmit`. Fix all errors. Common issues to look for:
- `searchParams.get('from')` may need `'use client'` directive on pages that use it
- New `order-details/page.tsx` types need to be properly typed (avoid `any`)
- `useSearchParams()` must be inside a Client Component — if any page using `useSearchParams` is a Server Component, add `'use client'` at the top

### Task: Verify Critical Flows

After all fixes, do the following navigation test manually:
1. Home → bell icon → notifications → back button → should return to home ✓
2. Settings → 联系客服 → back → should return to settings ✓  
3. Product catalog → product detail → back → should return to catalog ✓
4. Settings → 我的订单 → order list page loads (not 404) ✓
5. Home → 精选推荐 → 查看全部 → highlights page ✓
6. Wishlist tab (bottom nav) → no back button in top bar (it's a root tab) ✓
7. Loading page shows 「SYSTEM APP FORMULA」+ dots + 「正在加载…」✓
