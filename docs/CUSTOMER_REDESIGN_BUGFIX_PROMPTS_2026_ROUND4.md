# Customer App — Fix Prompts Round 4 (March 2026)

Run agents in order. Read `docs/CUSTOMER_REDESIGN_PLAN_2026.md` for constraints.
**Rules:** No `any`, no `!`, double quotes, 100% Chinese UI, no `router.back()`. `npx tsc --noEmit` after every agent.

---

## AGENT 1 — Replace next/image with native `<img>` for ALL post media (CRITICAL)

### Root Cause
`next/image` (`Image` component) **cannot render video URLs** and **requires domain whitelisting for every external image host**. When a Supabase URL is used with `next/image`, it works for images — but silently shows broken alt text when:
- The URL returns a content-type of `video/mp4` (next/image tries to display it as an image → fails)
- The URL is not whitelisted in `next.config.mjs`
- The image optimization worker encounters an error

**Solution:** Stop using `next/image` for post card media entirely. Use a native `<img>` tag with proper `loading="lazy"` for images, and a `<video>` tag for videos. This avoids all the optimization pipeline issues while still lazy-loading.

**File: `asf-2-next/src/components/PostCard.tsx`**

Read the full file. Replace the entire media block (the `pt-[125%]` container that holds either `<Image>` or `<video>`):

```tsx
{/* Media Block */}
<div className="w-full relative pt-[125%] bg-[var(--color-panel)] overflow-hidden">
  {!firstMedia ? (
    <div className="absolute inset-0 bg-[var(--color-panel)]" />
  ) : isVideo ? (
    <>
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
      {/* Fullscreen button */}
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
    </>
  ) : (
    // Fallback for broken images
    imgError ? (
      <div className="absolute inset-0 bg-[var(--color-panel)]" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={firstMedia}
        alt={post.caption ?? "精选内容"}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    )
  )}
</div>
```

Remove `import Image from "next/image"` from the file since we're no longer using it.
Keep `imgError` state, `videoRef`, and all other logic as-is.

**File: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`**

Read the file. In the 精选推荐 posts strip (around line 296–320), replace the image rendering for non-video posts:
```tsx
// Remove: import Image from "next/image" if only used for posts
// Replace post image <Image ... /> with:
// eslint-disable-next-line @next/next/no-img-element
<img
  src={imgUrl}
  alt={post.caption ?? "精选内容"}
  loading="lazy"
  className="absolute inset-0 w-full h-full object-cover"
/>
```

For the **products grid** (新品上市), the existing `<Image>` from next/image is FINE to keep since these are product images from a known domain. Do not change the product card images.

**Verification:** `npx tsc --noEmit`. Open highlights page — first post image should load as a regular `<img>`, videos should autoplay. No "Post image" alt text. The `eslint-disable` comment is needed because Next.js ESLint warns about using `<img>` — include it exactly as shown to avoid build failures.

---

## AGENT 2 — Fix Settings Guest State: Add Bottom Nav + Guest Escape

### Root Cause
When a guest taps the 「我的」tab, `settings/page.tsx` renders a full-screen centered div (lines 113–124) that:
1. Has **no BottomNavbar** — so all 5 tabs disappear
2. Has **only one option**: 登录/注册 link → goes to sign-in
3. Has **no escape** back to home or browsing

The user feels trapped: bottom nav gone, only option is to sign in.

**File: `asf-2-next/src/app/(customer)/settings/page.tsx`**

Read the full file. Find the guest state block (approximately lines 113–124):
```tsx
if (!loading && !user) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
      ...
      <Link href="/authentication/sign-in?returnTo=%2Fsettings" ...>登录 / 注册</Link>
    </div>
  );
}
```

Replace the entire guest block with one that includes the BottomNavbar AND a guest escape:
```tsx
if (!loading && !user) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24 flex flex-col">
      <div className="sticky top-0 z-40 bg-white h-[56px] flex items-center justify-center border-b border-[var(--color-border)]">
        <h1 className="font-display text-lg tracking-wide">个人中心</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <FaUserCircle className="w-24 h-24 text-gray-200 mb-6" />
        <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">登录以查看个人资料</h2>
        <p className="text-sm text-[var(--color-muted)] mb-8">管理账户、查看订单并享受会员特权</p>
        
        <Link
          href="/authentication/sign-in?returnTo=%2Fsettings"
          className="w-full btn-primary rounded-xl py-3 max-w-sm mb-4 flex items-center justify-center"
        >
          登录 / 注册
        </Link>
        
        {/* Guest escape — cannot leave user stuck */}
        <button
          onClick={() => router.push("/")}
          className="w-full max-w-sm h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center"
        >
          先逛逛，暂不登录
        </button>
      </div>
      
      <BottomNavbar />
    </div>
  );
}
```

Make sure `import BottomNavbar from "@/components/home/bottom-nav";` is at the top of the file (it may already exist from the previous agent run — check and only add if missing).
Also make sure `import { useRouter } from "next/navigation";` is imported.

**Verification:** Log out. Tap 我的 tab. You should see the guest state with the bottom nav still present (all 5 tabs). You should see 「先逛逛，暂不登录」 button. Tapping it goes to home. Bottom nav tabs all still work.

---

## AGENT 3 — Fix Sign-In Ghost Button + Wishlist Guest Escape

### Issue A: Sign-in 先逛逛 button prominence

**File: `asf-2-next/src/app/authentication/sign-in/page.tsx`**

Read the full file. Find the bottom section with 「游客浏览」. Currently it's a tiny underlined text link. Check if the prior agent already replaced it with a ghost button. If it's still a small link OR the ghost button exists but is below the keyboard fold:

The correct layout structure inside the form panel should be (from top to bottom):
1. `h2` heading: 欢迎回来
2. Error message (conditional)
3. Form fields (email + password)
4. 忘记密码 link (right-aligned)  
5. `登录` primary button
6. **`先逛逛，暂不登录` ghost button** — immediately below 登录
7. `还没有账号？立即注册 →` link — at the very bottom

This order ensures the ghost button is visible without scrolling on most devices. If the current order puts the ghost button after the 注册 link, swap them.

Ensure the ghost button has these exact styles:
```tsx
<button
  type="button"
  onClick={() => router.push("/")}
  className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center mt-3"
>
  先逛逛，暂不登录
</button>
```

### Issue B: Sign-Up page — same fix
**File: `asf-2-next/src/app/authentication/sign-up/page.tsx`**

Read the full file. After the 注册 submit button, add the same ghost button:
```tsx
<button
  type="button"
  onClick={() => router.push("/")}
  className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center mt-3"
>
  先逛逛，暂不登录
</button>
```

### Issue C: Wishlist guest state escape
**File: `asf-2-next/src/app/(customer)/wishlist/page.tsx`**

Find the `!user` block (approximately lines 51–61). Currently shows a login button only. Add a guest escape option below the login button (not a separate button if space is tight — use a text link):
```tsx
<button
  onClick={() => router.push("/product-section")}
  className="mt-4 text-sm text-[var(--color-muted)] underline underline-offset-4"
>
  继续浏览商品 →
</button>
```

**Verification:** `npx tsc --noEmit`. Sign-in page: ghost button visible without scrolling on 390×844. Sign-up page: same ghost button present. Wishlist guest state: both login option and browse option visible. None of these states trap the user.

---

## AGENT 4 — Fix Post Image on Home Page Strip + Category Pills English

### Issue A: Home page 精选推荐 strip broken images
**File: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`**

Read the 精选推荐 posts strip section carefully (around line 295–343). The `isVideo` check uses `(post.medias?.[0] as any)?.media_type` — this `as any` cast may cause the detection to fail. Apply the same fix as PostCard:

```ts
const rawMediaType = String((post.medias?.[0] as { media_type?: unknown } | undefined)?.media_type ?? "");
const isVideo =
  rawMediaType.startsWith("video") ||
  (typeof imgUrl === "string" && /\.(mp4|mov|webm)/i.test(imgUrl.split("?")[0]));
```

For the image rendering in the strip, if it currently uses `<Image>` (next/image) replace with native `<img loading="lazy">` — same reason as Agent 1:
```tsx
// eslint-disable-next-line @next/next/no-img-element
<img
  src={imgUrl}
  alt={post.caption ?? "精选内容"}
  loading="lazy"
  className="absolute inset-0 w-full h-full object-cover"
/>
```

### Issue B: English category pills in 商品分类
The home page and product catalog show English category names: "Handbag", "Streetwear", "Spring Collection". This is because the `categories` table has English names as entered by the admin.

This is a **data issue** not a code issue — translation should happen in the admin panel. However, for demo purposes, apply a client-side name mapping in the components that render categories.

**File: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`** (商品分类 section)

Add a translation map before the JSX:
```tsx
const CATEGORY_NAMES: Record<string, string> = {
  "Handbag": "手袋",
  "Streetwear": "街头服饰",
  "Spring Collection": "春季新品",
  "Ladies": "女装",
  "Men": "男装",
  "Accessories": "配饰",
  "Shoes": "鞋履",
  "Beauty": "美妆",
};

// In the category pill render:
{CATEGORY_NAMES[cat.name] ?? cat.name}
```

Apply the same mapping in `asf-2-next/src/app/(customer)/product-section/_components/ProductSectionClient.tsx` if it also shows category filters.

**Verification:** `npx tsc --noEmit`. Home page 精选推荐 strip — post thumbnails load (no alt text visible). Category pills all show in Chinese. Highlights page posts load images and videos.

---

## AGENT 5 — Final Verification Sweep

### TypeScript
`npx tsc --noEmit` — fix every error, especially:
- `eslint-disable-next-line` comments are JSX comments (`{/* */}`) not TS — ensure placed correctly ABOVE the `<img>` tag: `{/* eslint-disable-next-line @next/next/no-img-element */}`
- All `as unknown as {...}` casts in the video fullscreen handler compile cleanly

### Manual verification checklist
Run through these flows exactly:

**GUEST:**
1. Open app. Home loads. Bottom nav shows 5 tabs. ✓
2. Tap 精选 → highlights. Bottom nav shows. Posts have images. Videos play. ✓  
3. Tap 收藏 → wishlist loads (not home). Bottom nav shows. Login + 继续浏览 options visible. ✓
4. Tap 我的 → settings guest state. Bottom nav STILL shows (all 5 tabs). 先逛逛 button visible. ✓
5. Tap 先逛逛 → goes to home. ✓
6. Tap 购物 → catalog. Bottom nav shows. ✓
7. Tap product → PDP. No bottom nav (correct). Back button present. ✓
8. Tap back → returns to catalog (not home). ✓ (or home if came from home — verify `?from=` param is working)

**SIGN-IN PAGE:**
9. Go to sign-in. Full page screenshot — `先逛逛，暂不登录` ghost button clearly visible without scrolling. ✓
10. Tap 先逛逛 → returns to home. ✓

**AUTHENTICATED:**
11. Log in. Settings page. Bottom nav visible. ✓
12. Tap every menu item: 我的订单 ✓, 积分与奖励 ✓, 联系客服 ✓, 账户设置 ✓ (expands inline). Back from each → settings. ✓
13. Tap bell → notifications. Bottom nav visible. Back → home. ✓
