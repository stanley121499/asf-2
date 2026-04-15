# Customer App — Fix Prompts Round 5 (March 2026)

Based on a thorough UX audit simulating a 55+ year old non-tech-savvy user, several critical friction points remain. Run the following agents in order.

**Rules:** No `any`, no `!`, use double quotes, 100% Chinese UI for user-facing text, no `router.back()`. `npx tsc --noEmit` after every agent.

---

## AGENT 1 — Improve Missing Media Fallback (Don't let the app look "broken")

### Root Cause
Due to invalid test data in the database (wrong `media_type` or broken URLs), some posts load as blank gray boxes because the `<img onError>` fallback triggers. To an older user, a giant gray box looks like the app itself is broken. We need a clear, friendly placeholder states so they know the app is fine, just that specific image is missing.

**File: `asf-2-next/src/components/PostCard.tsx`**

1. At the top of the file, ensure you import an icon for the fallback, e.g., `HiOutlinePhotograph` from `"react-icons/hi"`.
2. Find the fallback block for `imgError`:
```tsx
          imgError ? (
            <div className="absolute inset-0 bg-[var(--color-panel)]" />
          )
```
Replace it with a friendly UI component:
```tsx
          imgError ? (
            <div className="absolute inset-0 bg-[var(--color-panel)] flex flex-col items-center justify-center text-[var(--color-muted)]">
              <HiOutlinePhotograph className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">图片暂时无法加载</span>
            </div>
          )
```

**File: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`**

1. Find the posts strip (`精选推荐` section). It currently maps over `featuredPosts` and renders `<img ... onError={...} />`. Wait — `HomePageClient.tsx` currently does *not* have an `imgError` state for each post in the strip because it renders raw `<img>` tags in a `.map`.
2. Convert the image rendering in the `featuredPosts.map` section to use a small inline component or handle the error gracefully so it doesn't show the broken image icon. Since creating a new component inside map is tricky with state, simply use a fallback image via `e.currentTarget.src = '/default-image.jpg'` on error:
```tsx
<img
  src={imgUrl}
  alt={post.caption ?? "精选内容"}
  loading="lazy"
  className="absolute inset-0 w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = "/default-image.jpg";
    e.currentTarget.className = "absolute inset-0 w-full h-full object-cover opacity-50 grayscale";
  }}
/>
```

---

## AGENT 2 — Stop "Forced Sign-In" on Add to Bag

### Root Cause
When a guest taps "加入购物袋" (Add to Bag), the app instantly redirects to `/authentication/sign-in`. This feels incredibly jarring and aggressive to users who are just "browsing". We must ask them contextually.

**File: `asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`**

1. Find the `handleAddToCart` function.
2. Replace the abrupt redirect:
```tsx
    if (!user?.id) {
      router.push("/authentication/sign-in");
      return;
    }
```
With a confirmation prompt that explains *why*, and routes back to this exact product after logging in:
```tsx
    if (!user?.id) {
      const confirmLogin = window.confirm("请先登录或注册账号，即可将此商品加入购物袋。");
      if (confirmLogin) {
        const currentPath = `/product-details/${product.id}`;
        router.push(`/authentication/sign-in?returnTo=${encodeURIComponent(currentPath)}`);
      }
      return;
    }
```
3. Do the EXACT SAME thing for `handleToggleWishlist`. If `!user?.id`, use `window.confirm("请先登录或注册账号，即可收藏此商品。")` and push to sign-in with the same `returnTo`.

---

## AGENT 3 — Brand Logo Clarity & English Categories

### Issue A: "SYSTEM APP FORMULA" is confusing
Older users saw the English phrase "SYSTEM APP FORMULA" in the nav bar and thought it was an error message or system text, not a brand. The brand abbreviation "ASF" is much more recognizable as a logo mark.

**File: `asf-2-next/src/components/navbar-home.tsx`**

Find the logo `<Link>`:
```tsx
<Link
  href="/"
  className="font-display text-[var(--color-text)] shrink min-w-0 overflow-hidden"
  style={{ fontSize: "12px", ... }}
>
  SYSTEM APP FORMULA
</Link>
```
Rewrite it to use the bold "ASF" abbreviation styled like a premium luxury brand logo:
```tsx
<Link
  href="/"
  className="font-display text-[var(--color-text)] shrink-0"
  style={{ fontSize: "22px", letterSpacing: "0.15em", fontWeight: "600" }}
>
  ASF
</Link>
```

### Issue B: "Pants" category in English
**File: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`**
Update `CATEGORY_NAMES` mapping to ensure no English slips through:
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
  "Pants": "长裤",
  "Tops": "上衣",
  "Bottoms": "下装"
};
```
Apply the identical mapping update to **`asf-2-next/src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`** (if it has `CATEGORY_NAMES`).

---

## AGENT 4 — Fix Bottom Navigation Reliability

### Root Cause
On some pages (like Highlights), Next.js `<Link>` tags for soft navigation appeared to freeze or become non-interactive when the app router was busy or suspended. To ensure rock-solid mobile responsiveness, we will force explicit programmatic routing on the main bottom nav.

**File: `asf-2-next/src/components/home/bottom-nav.tsx`**

1. Read the file. You will see 5 `<Link href="...">` tags.
2. Ensure you have `import { usePathname, useRouter } from "next/navigation";` at the top.
3. Add `const router = useRouter();` inside the component.
4. Convert all 5 tabs to use `button` instead of `Link` using `router.push()`, or keep `Link` but add an `onClick` override that forces an immediate programmatic push:

```tsx
        <Link 
          href="/product-section" 
          onClick={(e) => { e.preventDefault(); router.push("/product-section"); }}
          className="inline-flex flex-col items-center justify-center min-h-[56px] min-w-[56px] group"
        >
          <HiOutlineShoppingBag className={`w-5 h-5 mb-1 ${getStyle("/product-section")}`} />
          <span className={`text-[10px] ${getStyle("/product-section")}`}>购物</span>
        </Link>
```
5. Apply this pattern `onClick={(e) => { e.preventDefault(); router.push("..."); }}` to ALL 5 tabs (`/`, `/product-section`, `/highlights`, `/wishlist`, `/settings`). This bypasses any Next.js soft-nav suspension issues and forces the route change immediately, giving instant feedback to the user.

---

## AGENT 5 — Final Sweep: TypeScript & Verification
1. Run `npx tsc --noEmit` and resolve any missing imports (e.g., `HiOutlinePhotograph`).
2. Verify all UI strings. There should be zero visible English UI elements unless they are product database names.
