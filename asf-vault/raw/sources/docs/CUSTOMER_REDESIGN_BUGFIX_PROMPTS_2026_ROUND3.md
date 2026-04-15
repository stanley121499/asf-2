# Customer App — Fix Prompts Round 3 (March 2026)
Run agents in order. Read `docs/CUSTOMER_REDESIGN_PLAN_2026.md` for constraints.

**Rules:** No `any`, no `!`, double quotes, 100% Chinese UI, no `router.back()`. Run `npx tsc --noEmit` after every agent.

---

## AGENT 1 — Fix Bottom Nav on Every Custom-Layout Page

### Root Cause
`NavbarHome` (`components/navbar-home.tsx`) renders `<BottomNavbar />` as part of itself (line 75). This means **any page using `LandingLayout`** gets both the top bar AND the bottom nav automatically. BUT several pages render their own custom top bar WITHOUT `LandingLayout`, so they get neither. These are the pages missing the bottom nav.

### Pages to Fix
For each file: read the full file, add `import BottomNavbar from "@/components/home/bottom-nav";` at the top, add `<BottomNavbar />` as the LAST child of the outermost div. Ensure root div has at least `pb-24`.

**1. `asf-2-next/src/app/(customer)/highlights/_components/HighlightsClient.tsx`**
Root tab (精选). Add BottomNavbar. No back button — it's a root tab. Top bar stays as just centered title 「精选推荐」.

**2. `asf-2-next/src/app/(customer)/wishlist/page.tsx`**
Root tab (收藏). Add BottomNavbar.

**3. `asf-2-next/src/app/(customer)/settings/page.tsx`**
Root tab (我的). Add BottomNavbar if not already present.

**4. `asf-2-next/src/app/(customer)/cart/page.tsx`**
Child page but add BottomNavbar anyway — users should still be able to navigate from cart.

**5. `asf-2-next/src/app/(customer)/order-details/page.tsx`** (list page)
Add BottomNavbar. Back button → `router.push('/settings')`.

**6. `asf-2-next/src/app/(customer)/goal/page.tsx`**
Add BottomNavbar. Back button → `router.push('/settings')`.

**7. `asf-2-next/src/app/(customer)/support-chat/page.tsx`**
Add BottomNavbar. Back button → `router.push('/settings')`.

**8. `asf-2-next/src/app/(customer)/notifications/page.tsx`**
Add BottomNavbar. Back button uses `useSearchParams().get('from') ?? '/'`.

### Also: Verify WishlistContext is in SlimLandingContextBundle
The wishlist tab (收藏) navigates to `/wishlist` but may silently crash if `WishlistContextProvider` is not included in `SlimLandingContextBundle`. Check `asf-2-next/src/context/RouteContextBundles.tsx` — confirm `WishlistContextProvider` is inside `SlimLandingContextBundle`. If missing, add it. This is likely why tapping 收藏 redirected to home instead of loading the wishlist.

**Verification:** Tap every bottom nav tab (首页/购物/精选/收藏/我的) — bottom nav visible on ALL five. Bell → notifications → bottom nav visible. 我的订单 → bottom nav visible.

---

## AGENT 2 — Fix Post Media: Images and Videos in Highlights

### Root Cause
`PostCard.tsx` uses `next/image` for all media. When a video URL is passed (because `media_type === 'video'` check fails to match DB values like `video/mp4`), `next/image` tries to load a video URL as an image, fails silently, and renders the broken "Post image" alt text gray box.

**File:** `asf-2-next/src/components/PostCard.tsx`

**Step 1 — Fix video detection:**
```ts
// Replace:
const isVideo = firstMediaObj?.media_type === 'video' || (firstMedia && firstMedia.match(/\.(mp4|mov|webm)$/i));

// With:
const mediaType = (firstMediaObj as { media_type?: string } | null)?.media_type ?? "";
const isVideo =
  mediaType.startsWith("video") ||
  (typeof firstMedia === "string" && /\.(mp4|mov|webm)/i.test(firstMedia.split("?")[0]));
```

**Step 2 — Fix video element (autoPlay + fullscreen):**
Add `const videoRef = React.useRef<HTMLVideoElement>(null);` near the top.

Replace the `<video>` element with:
```tsx
<video
  ref={videoRef}
  src={firstMedia}
  autoPlay
  loop
  muted
  playsInline
  preload="metadata"
  className="absolute inset-0 w-full h-full object-cover"
/>
<button
  type="button"
  aria-label="全屏播放"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) { void v.requestFullscreen(); }
    else if ((v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }}
  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white z-20"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>
  </svg>
</button>
```

**Step 3 — Fix broken image fallback:**
Add `const [imgError, setImgError] = useState(false);` at top of component.

Replace the `<Image>` block:
```tsx
{imgError || !firstMedia ? (
  <div className="absolute inset-0 bg-[var(--color-panel)]" />
) : (
  <Image
    src={firstMedia}
    alt={post.caption ?? "精选内容"}
    fill
    sizes="100vw"
    quality={80}
    className="object-cover"
    onError={() => setImgError(true)}
  />
)}
```

**Step 4 — Fix HomePageClient.tsx posts strip and product grid:**
In `HomePageClient.tsx`:

For the **posts strip** (精选推荐 section), fix the `isVideo` detection inline:
```ts
const mediaType = (post.medias?.[0] as { media_type?: string } | undefined)?.media_type ?? "";
const isVideo =
  mediaType.startsWith("video") ||
  (typeof imgUrl === "string" && /\.(mp4|mov|webm)/i.test(imgUrl.split("?")[0]));
```

For **posts strip image**, replace raw `<img>`:
```tsx
// Replace: <img src={imgUrl} alt="Post" .../>
// With:
<Image src={imgUrl} alt={post.caption ?? "精选内容"} fill sizes="80vw" quality={80} className="object-cover" />
```

For **products grid** (新品上市), replace raw `<img>`:
```tsx
// Replace: <img src={imgUrl} alt={product.name || ""} .../>
// With:
<Image src={imgUrl} alt={product.name || "商品"} fill sizes="50vw" quality={75} className="object-cover" priority={index < 2} />
```
Add `import Image from "next/image";` to HomePageClient imports if not already present.

**Verification:** `npx tsc --noEmit`. Highlights page: images load, videos autoplay inline muted, fullscreen button visible. No "Post image" alt text anywhere. Home page products grid loads images via next/image.

---

## AGENT 3 — Fix Sign-In: Unmissable Guest Option + Sign-Up Escape

### Root Cause
Sign-in page's `游客浏览` is tiny gray underlined text at the very bottom, invisible to a 55+ user redirected here. The prominent ghost button from the planned fix was never implemented.

**File:** `asf-2-next/src/app/authentication/sign-in/page.tsx`

Read the full file. Find the bottom section (`<div className="mt-8 flex flex-col items-center gap-4...">` or similar). Replace the entire block with:

```tsx
<div className="mt-6 flex flex-col items-center gap-4">
  {/* Guest escape — prominent, full width */}
  <button
    type="button"
    onClick={() => router.push("/")}
    className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center active:bg-gray-50 transition-colors"
  >
    先逛逛，暂不登录
  </button>
  <p className="text-[var(--color-muted)] text-sm">
    还没有账号？{" "}
    <Link href="/authentication/sign-up" className="text-[var(--color-accent)] font-medium">
      立即注册 →
    </Link>
  </p>
</div>
```

Remove the old tiny `游客浏览` link. Keep the `← 返回首页` top-left back button as-is.

**File:** `asf-2-next/src/app/authentication/sign-up/page.tsx`
Read the file. Find and add the same ghost button below the 注册 submit button:
```tsx
<button
  type="button"
  onClick={() => router.push("/")}
  className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center active:bg-gray-50 transition-colors mt-3"
>
  先逛逛，暂不登录
</button>
```

**Also: Wishlist guest state — add escape option**
In `asf-2-next/src/app/(customer)/wishlist/page.tsx`, find the `!user` early return block. Below the login button, add:
```tsx
<button
  onClick={() => router.push("/product-section")}
  className="mt-3 text-sm text-[var(--color-muted)] underline underline-offset-4"
>
  继续浏览商品 →
</button>
```

**Verification:** Logout. Tap 收藏 → see "登录以查看收藏" + "继续浏览商品 →" below. Navigate to sign-in. Without scrolling, you see: form, 登录 button, and 先逛逛，暂不登录 ghost button. No tiny gray text escape anywhere.

---

## AGENT 4 — Hero Readability + Logo Fix + Elderly UX CTAs

### Issue A: Hero watermark overlapping caption

**File:** `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`

Find the gradient overlay div in the hero section (approximate line 189):
```tsx
<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
```
Replace with a stronger, taller gradient:
```tsx
<div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
```

Find the caption `<p>` tag in the hero (around line 193). Add text shadow via inline style:
```tsx
<p
  className="font-display text-white text-lg mb-4 line-clamp-2 leading-snug max-w-[85%]"
  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 32px rgba(0,0,0,0.7)" }}
>
  {firstPost.caption}
</p>
```

Replace the small text hero CTA buttons with proper pill buttons (min 44px touch target):
```tsx
<div className="flex gap-3 flex-wrap mb-3">
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/product-section"); }}
    className="px-5 py-2.5 rounded-full bg-white/90 text-[var(--color-text)] text-sm font-medium min-h-[44px] flex items-center backdrop-blur-sm"
  >
    探索新品 →
  </button>
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/highlights"); }}
    className="px-5 py-2.5 rounded-full border border-white/70 bg-white/10 text-white text-sm font-medium min-h-[44px] flex items-center backdrop-blur-sm"
  >
    精选内容 →
  </button>
</div>
```

### Issue B: Logo "SYSTEM APP FORMULA" truncated

**File:** `asf-2-next/src/components/navbar-home.tsx`

Find the logo `<Link>` (line 38). The text is too wide at `text-lg tracking-wider`. Fix:
```tsx
<Link
  href="/"
  className="font-display text-[var(--color-text)] shrink min-w-0 overflow-hidden"
  style={{ fontSize: "12px", letterSpacing: "0.1em", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "55%" }}
>
  SYSTEM APP FORMULA
</Link>
```
Add `shrink-0` to the icons container so icons never compress:
```tsx
<div className="flex items-center gap-1 shrink-0">
```

**Verification:** `npx tsc --noEmit`. At 390px width: full "SYSTEM APP FORMULA" visible (or elegantly truncated with ellipsis, never cut mid-word). Hero has two clearly tappable pill buttons. Caption text readable over any background image.

---

## AGENT 5 — Final Sweep: router.back(), English strings, TypeScript

### Task 1: Eliminate all `router.back()` calls
```
grep -rn "router\.back()" asf-2-next/src/app/(customer)/
grep -rn "router\.back()" asf-2-next/src/components/
```
For every hit, replace with an explicit `router.push('/appropriate-route')`. Common replacements:
- In child pages of settings: `router.push('/settings')`
- In product detail: `router.push('/product-section')`
- In highlights: this is now a root tab, no back needed

### Task 2: English string sweep
```
grep -rn "\"Post\"\|alt=\"Post\"\|Give us a moment\|loading\.\.\." asf-2-next/src/
```
Fix: `alt="Post"` → `alt={post.caption ?? "精选内容"}` (already done in Agent 2, verify)

### Task 3: TypeScript
`npx tsc --noEmit` — fix ALL errors. Common issues:
- `useRef<HTMLVideoElement>` needs `null` initial value and proper null checking
- `(v as unknown as ...)` cast for webkit fullscreen API
- `index` in `.map((item, index) => ...)` needs to be declared in the callback

### Task 4: Inline loading spinners
Replace any `<div>正在加载...</div>` inline strings with the bounce dot spinner:
```tsx
<div className="flex items-center justify-center py-12">
  <div className="flex gap-1.5">
    {[0, 150, 300].map((delay) => (
      <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
    ))}
  </div>
</div>
```

### Task 5: Final manual check
1. Home — bottom nav 5 tabs ✓, hero buttons tappable ✓, logo not truncated ✓
2. 精选 tab → highlights → bottom nav ✓ → images load ✓ → videos play ✓
3. 收藏 tab → wishlist loads (NOT home) → bottom nav ✓
4. 我的 tab → settings → bottom nav ✓
5. Settings → 我的订单 → order list → bottom nav ✓ → back to settings ✓
6. Settings → 联系客服 → support chat → bottom nav ✓ → back to settings ✓
7. Bell icon → notifications → bottom nav ✓ → back → home ✓
8. Log out → 收藏 → see login + escape option ✓
9. Sign-in → 先逛逛 button clearly visible ✓
