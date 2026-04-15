# Customer App — Bug Fix Agent Prompts Round 2 (March 2026)

Run agents **in order**. Read `docs/CUSTOMER_REDESIGN_PLAN_2026.md` for shared constraints.

**Rules reminder:** No `any`, no `!`, double quotes, complete files, 100% Chinese UI, no `router.back()`.

---

## AGENT 1 — Image Performance: HomePageClient Raw `<img>` Tags

**Root cause confirmed:** `HomePageClient.tsx` uses raw `<img src={imgUrl}>` tags for BOTH product cards and the posts strip. These load full-size unoptimized images (1–5MB). The `PostCard.tsx` already uses `next/image` correctly but the HOME page does not.

**File:** `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`

Read the full file. Find two sections:

**Section A — 新品上市 product grid (around line 237):**
Currently: `<img src={imgUrl} alt={product.name || ""} className="absolute inset-0 w-full h-full object-cover" />`

Replace with `next/image`:
```tsx
import Image from "next/image";
// ...
<Image
  src={imgUrl}
  alt={product.name || "商品"}
  fill
  sizes="(max-width: 640px) 50vw, 33vw"
  quality={75}
  className="object-cover"
/>
```
Add `priority={true}` on the FIRST two products only (index 0 and 1). All others keep `priority={false}` (default).

**Section B — 精选推荐 posts strip (around line 319):**
Currently: `<img src={imgUrl} alt="Post" className="absolute inset-0 w-full h-full object-cover" />`

Replace: same pattern but `sizes="80vw"` (cards are 80vw wide). Do NOT use priority here.

Also fix: the alt text is literally `"Post"` — this causes the "Post" broken image text to show. Change to `alt={post.caption ?? "精选内容"}`.

**Verification:** `npx tsc --noEmit`. Open home page, open DevTools Network → Img filter. Images should be smaller (WebP, <300KB). No more "Post" alt text visible on broken images.

---

## AGENT 2 — Video Rendering: Fullscreen Support + Media URL Fix

**Root cause confirmed:** The highlights page shows a completely gray area for video posts. Two issues:
1. `PostCard.tsx` uses `preload="none"` which means the video doesn't start loading, but more importantly the `poster="/default-image.jpg"` is a local file that may not exist — so nothing renders in the gray box.
2. There is no fullscreen button — users cannot view video content full screen.

**Files:**
- `asf-2-next/src/components/PostCard.tsx`
- `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx` (posts strip video handling)

**Task: PostCard.tsx — Fix video rendering**

Find the video `<video>` element (currently around line 107–115). Issues:
- `preload="none"` means the video won't show a poster frame. Change to `preload="metadata"` — this loads just the first frame so users see something immediately without downloading the whole file.
- `poster="/default-image.jpg"` is a placeholder. Instead, use the first non-video media from `sortedMedias` as poster if available, otherwise remove the poster attribute entirely (the browser will show the first frame from `preload="metadata"`).
- Add `autoPlay` and `loop` attributes since posts auto-play inline in feeds (muted + autoPlay is the standard for feed videos).

Replace the video element with:
```tsx
<video
  src={firstMedia}
  autoPlay
  loop
  muted
  playsInline
  preload="metadata"
  className="absolute inset-0 w-full h-full object-cover"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    const vid = e.currentTarget;
    if (vid.requestFullscreen) {
      void vid.requestFullscreen();
    }
  }}
/>
```

Add a **fullscreen button** overlay on top of the video (visible always, not just on hover, for elderly users):
- Bottom-right corner of the media block: absolute positioned button
- Icon: use `HiOutlineArrowsExpand` from `react-icons/hi` (or `HiArrowsExpand`)
- Style: `w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white`
- `aria-label="全屏播放"`
- On click: `e.preventDefault(); e.stopPropagation(); videoRef.current?.requestFullscreen();`
- Use `useRef<HTMLVideoElement>(null)` and attach `ref={videoRef}` to the `<video>` element
- Only show this button when `isVideo` is true

**Task: HomePageClient.tsx — Posts strip video poster fix**

In the 精选推荐 strip (around line 310–316), for video posts the agent currently shows `/default-image.jpg` as the poster image behind a play icon. This works fine as a design pattern — but the `/default-image.jpg` may not exist. Replace this with a dark gradient div as fallback:

Change:
```tsx
<img src="/default-image.jpg" alt="Video poster" className="absolute inset-0 w-full h-full object-cover" />
```
To:
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#2d2417]" />
```

**Verification:** `npx tsc --noEmit`. Open highlights page. Videos should auto-play muted inline. Fullscreen button visible at bottom-right of video. Tapping it opens fullscreen video player.

---

## AGENT 3 — Highlights Discovery: Make Entry Point Unmissable for Elderly Users

**Root cause confirmed:** The current entry points to highlights are:
1. A small white text button `精选内容 →` overlaid on the hero (low contrast, hard to see, easily missed)
2. A small `查看全部 →` link in sand/accent color next to the 精选推荐 section title

Both are VERY subtle. A 55+ user who doesn't scroll all the way down will never see #2. And #1 is only visible if they look at the bottom of the hero.

**Solution:** Add a dedicated, prominent **bottom nav tab** for 精选推荐, OR add a large "billboard" entry card between sections. Given we've committed to a 4-tab bottom nav, the best approach is:

**File:** `asf-2-next/src/components/home/bottom-nav.tsx`

Change the bottom nav from 4 tabs to 5 tabs. Replace 「已收藏」 at position 3 with 「精选」, and move 「已收藏」 to 「我的」 (link from the profile/settings page). Wait — actually we should NOT crowd the wishlist out. Instead, replace the current 4th tab (我的) position ordering with:

**New 5-tab layout:**
| Position | Icon | Label | Route |
|---|---|---|---|
| 1 | `HiOutlineHome` | 首页 | `/` |
| 2 | `HiOutlineShoppingBag` | 购物 | `/product-section` |
| 3 | `HiOutlinePlay` or `HiOutlineFilm` | 精选 | `/highlights` |
| 4 | `HiOutlineHeart` | 收藏 | `/wishlist` |
| 5 | `HiOutlineUser` | 我的 | `/settings` |

Each tab: minimum `min-w-[56px]` flex column center. Bottom nav height stays 64px. The 5-tab version uses smaller icons (`h-5 w-5` instead of `h-6 w-6`) and slightly smaller label text (`text-[10px]`).

Active state detection: use `usePathname()`. 精选 tab is active when pathname starts with `/highlights`.

Also update the active tab detection for ALL tabs to use `pathname.startsWith()` not exact match, so `/product-section/[id]` still shows 购物 as active.

**Also update `HighlightsClient.tsx`:**
The back button on highlights page currently always routes to `/`. Now that highlights has its own bottom nav tab, the `← 返回` button in the top bar should be removed OR only shown when the user navigated from somewhere other than the bottom nav (the tab itself replaces the need for a back button on a root screen).

Simple fix: **remove the back button entirely** from `HighlightsClient.tsx` toolbar. The page title 「精选推荐」stays centered. Use the bottom nav tab to go to other pages.

**Verification:** Bottom nav now shows 5 tabs. 「精选」tab in the middle. Tapping it goes to `/highlights`. Highlights page has no back button (it's a root tab). Elderly users can now discover content with a single tap from any page in the app.

---

## AGENT 4 — Support Chat Auth Loop + Cart Bottom Nav Missing

### Part A: Support Chat — Blank Page / Auth Redirect Loop

**Root cause:** The `support-chat` page depends on `CommunityContextBundle` which requires authentication. The auth check redirects to sign-in, but sign-in redirects back, causing a loop or blank page.

**File:** `asf-2-next/src/app/(customer)/support-chat/page.tsx`

Read the full file. The fix depends on what the auth check looks like:

Option A — If the page has `if (!user) { router.push('/authentication/sign-in?returnTo=/support-chat'); return null; }`: The sign-in page likely redirects back correctly. The blank page issue may be that the redirect hasn't been implemented. Ensure the sign-in page reads `returnTo` param and routes to it after successful login.

Option B — If the CommunityContextBundle is causing the component to crash: Wrap the support chat content in a `try/catch` error boundary, OR remove the bundle dependency by using a simplified ticket form that doesn't require the full CommunityContextBundle.

**Simplest reliable fix:** If the support chat still renders blank for logged-in users, check if there's a `guard.tsx` or similar auth guard wrapping the route. If the user IS logged in but the page is still blank, the issue is a context provider crash. Add a simple guard at the top of the support-chat page component:

```tsx
const { user, loading } = useAuthContext();
if (loading) return <LoadingPage />;
if (!user) {
  router.push(`/authentication/sign-in?returnTo=${encodeURIComponent('/support-chat')}`);
  return null;
}
```

Then render a **simple static ticket form** (no CommunityContextBundle dependency) if the bundle continues to fail:
- Three inputs: ticket type (select: 「订单问题」「商品咨询」「账号问题」「其他」), subject (text), description (textarea)
- Submit button: 「提交工单」
- On submit: show a success screen with message 「您的请求已提交，我们将在24小时内与您联系」and a 「返回设置」button → `router.push('/settings')`
- This removes the real-time chat dependency for now (it's a demo)

### Part B: Cart — Bottom Nav Missing on Empty State

**Root cause confirmed:** When cart is empty, the bottom nav disappears. This suggests the cart page is NOT using the shared layout that renders `<BottomNav>`, or the empty state renders outside the layout wrapper.

**File:** `asf-2-next/src/app/(customer)/cart/page.tsx`

Read the file. Check if:
1. The page uses `LandingLayout` or similar wrapper — if not, add it
2. The bottom nav is rendered by the `(customer)/layout.tsx` — if so, the cart page should NOT need to add it manually

Check `asf-2-next/src/app/(customer)/layout.tsx` to see if `<BottomNav>` is rendered there for all child pages. If it is, the cart page's empty state likely has a rendering issue (e.g., the cart page returns early before the layout wrapper is rendered).

Fix: Ensure the cart page always renders inside the `LandingLayout` or equivalent wrapper — even in the empty/guest/loading states. Move any early returns INSIDE the layout wrapper:

```tsx
return (
  <LandingLayout> {/* or whatever the wrapper is */}
    {loading ? <LoadingState /> : 
     !user ? <GuestState /> :
     cartItems.length === 0 ? <EmptyState /> :
     <CartContent />}
  </LandingLayout>
);
```

**Verification:** `npx tsc --noEmit`. Open cart when empty — bottom nav must be visible. Open support chat from settings while logged in — should show ticket form without redirecting to sign-in.

---

## AGENT 5 — Final Polish: Wishlist Page Tabs Not Loading + Minor Issues

### Wishlist page — tabs not rendering products

**File:** `asf-2-next/src/app/(customer)/wishlist/page.tsx`

Read the full file. Check if the wishlist page correctly renders tabbed content (「商品」and 「帖子」tabs as specified in Agent 7 of the original redesign). If it only shows one view / no tabs, add the tab toggle:

```tsx
const [activeTab, setActiveTab] = useState<'products' | 'posts'>('products');
```

Tab bar UI: two pill buttons below the top bar. Active = `bg-[var(--color-text)] text-white`. Inactive = `border text-[var(--color-text)]`.

Also confirm: no `← 返回` button in top bar (wishlist is a root tab now with 5-tab bottom nav after Agent 3). If there is a back button, remove it.

### Product card tap area on home page

In `HomePageClient.tsx`, section 新品上市: product cards are `<Link href="/product-details/{id}?from=%2F">` — ensure the `?from=` param is included so PDP back button goes to home (`/`) when coming from home.

### PDP back button route with `from` param

**File:** `asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`

The back button should read `useSearchParams().get('from') ?? '/product-section'`. Verify this was correctly implemented by the previous bugfix agents. If the back button still hardcodes `/product-section`, update it to use the `from` param.

### Final TypeScript and English string sweep

Run `npx tsc --noEmit` and fix all errors.

Search for any `router.back()` remaining in customer-facing files:
```
grep -r "router.back()" asf-2-next/src/app/(customer)/
```
Replace any found with explicit `router.push('/')` or the appropriate route.

Search for English strings in customer UI:
```
grep -rn '"Dresses"\|"Summer Collection"\|"Basic Tee"\|"Accessories"\|"Give us a moment"\|"loading..."' asf-2-next/src/
```
Fix any found.
