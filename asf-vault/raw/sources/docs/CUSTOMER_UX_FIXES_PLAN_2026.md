# Customer UX Fixes — Plan (March 2026)

## Context

After testing the customer-facing demo built in `asf-2-next`, 5 issues were found.
This document describes each problem, the root cause, and the fix strategy.

---

## Fix 1 — Page Transitions Feel Unresponsive

### Problem
Switching between pages gives no visual feedback — the UI freezes until the next
page is fully ready. This feels like a crash to mobile users.

### Root Causes
**A — Dev mode lazy compilation (dev only):** Next.js compiles each page on first
visit in development. The terminal shows:
```
Compiled / in 23.4s
Compiled /product-section/[[...categoryId]] in 2.9s
```
This disappears entirely in production (`next build && next start`).

**B — No loading indicator (production too):** When a Next.js App Router server
component navigates, nothing visual happens until the server fetch resolves.
There is no progress bar or skeleton screen in any customer route.

### Fix Strategy

**Step 1 — Install `nextjs-toploader`**
A single package that adds an NProgress-style progress bar at the very top of the
screen on every client-side navigation. Gives immediate visual feedback with zero
effort. Import `<NextTopLoader>` once in `src/app/layout.tsx` (root layout).

**Step 2 — Add `loading.tsx` skeleton files**
Next.js App Router shows a `loading.tsx` file *instantly* (before server data
arrives) when navigating to that route. Create three files:
- `src/app/(customer)/loading.tsx` — home page skeleton
- `src/app/(customer)/product-section/[[...categoryId]]/loading.tsx` — product section skeleton
- `src/app/(customer)/product-details/[productId]/loading.tsx` — product detail skeleton

Each skeleton uses `animate-pulse` Tailwind classes to mimic the page structure.

### Files Changed
| File | Action |
|------|--------|
| `src/app/layout.tsx` | Add `<NextTopLoader>` |
| `src/app/(customer)/loading.tsx` | Create new |
| `src/app/(customer)/product-section/[[...categoryId]]/loading.tsx` | Create new |
| `src/app/(customer)/product-details/[productId]/loading.tsx` | Create new |

---

## Fix 2 — Bell Badge Wrong Colour + Not Disappearing

### Problem
- The bell badge on home page cards is indigo/purple gradient. It should be red
  (matches "notification" convention).
- Clicking the bell sometimes does not visually dismiss it.

### Root Cause
**Colour:** The button uses `bg-gradient-to-r from-indigo-700 to-purple-800`.
Needs to change to `bg-red-500`.

**Not disappearing:** The `dismissBell` and `toggleLocalSaved` functions are
plain functions recreated every render and passed as props into `renderItem`
callbacks. While the `setState` functional updater form prevents stale state,
wrapping these in `useCallback` ensures stable references and avoids potential
stale closure issues when captured in nested callbacks inside `renderItem`.
Additionally, for inline post cards inside `MediaAwareLink`, if the media probe
sets `isVideo = true`, the surrounding element changes from a `<Link>` to a
`<div role="button">` — using `useCallback` ensures the bell handler reference
is stable across these re-renders.

### Fix Strategy
- In `HomePageClient.tsx`: wrap `dismissBell` and `toggleLocalSaved` in `useCallback`
- In `HomeHighlightsCard.tsx`: change bell button class from `bg-gradient-to-r from-indigo-700 to-purple-800` to `bg-red-500`
- In `HomePageClient.tsx`: change the inline post card bell button class from `bg-gradient-to-r from-indigo-700 to-purple-800` to `bg-red-500`

### Files Changed
| File | Action |
|------|--------|
| `src/components/home/HomeHighlightsCard.tsx` | Change bell colour |
| `src/app/(customer)/_components/HomePageClient.tsx` | Wrap handlers in useCallback, change bell colour |

---

## Fix 3 — Remove Breadcrumbs from `/product-section`

### Problem
The product section page shows a breadcrumb nav (首页 → 商品 → [Category]).
This is redundant given the back button and clutters the mobile UI.

### Fix Strategy
In `ProductSectionClient.tsx`, remove the entire outer `<div>` that contains the
double-nested `<nav aria-label="Breadcrumb">` block. Keep the inline search bar
and filter/sort dropdowns.

### Files Changed
| File | Action |
|------|--------|
| `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx` | Delete breadcrumb block |

---

## Fix 4 — Saved Posts Not Appearing in Wishlist Page

### Problem
Users can save posts (highlights) from the home page using the bookmark button.
These saves are stored in `localStorage` under key `"saved_items"` as a JSON
array of strings in `"post:UUID"` format. However, the wishlist page
(`/wishlist`) only reads from `useWishlistContext()` which is backed by the
Supabase `wishlist` DB table (products only). Saved posts are never displayed.

### Root Cause
The wishlist page has no knowledge of `localStorage`. There is also no DB table
for saved posts — they are intentionally localStorage-only for the demo.

### Fix Strategy
Modify `src/app/(customer)/wishlist/page.tsx` to add a "已保存的帖子" (Saved Posts)
section above the existing product wishlist:

1. On mount, read `localStorage.getItem("saved_items")`, parse the JSON array,
   filter for strings starting with `"post:"`, extract the UUIDs.
2. If there are any saved post UUIDs, fetch the post rows and their media from
   Supabase client-side:
   - `supabase.from("posts").select("*").in("id", savedPostIds)`
   - `supabase.from("post_medias").select("*").in("post_id", savedPostIds)`
3. Render each saved post as a card showing: thumbnail (from post_medias),
   caption, and a "取消收藏" button that calls `toggleLocalSaved("post:UUID")`
   which removes it from localStorage and re-triggers the display.
4. The Supabase client is imported from `"@/utils/supabaseClient"` (browser client).
5. If no posts are saved, show nothing (no empty state for this section — the
   product empty state below is sufficient).

The `toggleLocalSaved` helper reads/writes `localStorage` using the same format
as `HomePageClient.tsx`:
```ts
const raw = localStorage.getItem("saved_items");
const set = new Set<string>(raw !== null ? (JSON.parse(raw) as string[]) : []);
set.delete(`post:${postId}`);
localStorage.setItem("saved_items", JSON.stringify([...set]));
```

### Files Changed
| File | Action |
|------|--------|
| `src/app/(customer)/wishlist/page.tsx` | Add saved posts section |

---

## Fix 5 — Save Icon Still a Heart in `/product-section`

### Problem
`ProductCard.tsx` (used in the product section grid) still shows a heart icon
(`FaHeart`/`FaRegHeart`) as an overlay button at the top-left of the product
image. Per the design direction, it should use the bookmark icon
(`FaBookmark`/`FaRegBookmark`) and be repositioned into the card footer,
inline with the product name (space-between layout), matching the style
established in `ProductDetailsClient.tsx`.

### Fix Strategy
In `ProductCard.tsx`:
1. Replace `FaHeart`/`FaRegHeart` imports with `FaBookmark`/`FaRegBookmark`
2. Remove the absolute-positioned overlay `<button>` from the image area entirely
3. In the card footer `<div className="p-4">`, restructure as two rows:
   - Row 1: `flex justify-between items-center` with product name (left) +
     bookmark button (right)
   - Row 2: Price (left-aligned, smaller, below name)
   OR: a single row with name + bookmark button space-between, price on a second line

The bookmark button is icon-only (no text), sized appropriately for a card footer
button. Styling should match the approach in `ProductDetailsClient.tsx`.

### Files Changed
| File | Action |
|------|--------|
| `src/components/home/ProductCard.tsx` | Heart → bookmark, move to footer |

---

## Agent Batching Strategy

| Prompt | Title | Issues | Files |
|--------|-------|--------|-------|
| **Prompt 1** | Code Fixes | #2 (bell), #3 (breadcrumbs), #5 (ProductCard) | `HomeHighlightsCard.tsx`, `HomePageClient.tsx`, `ProductSectionClient.tsx`, `ProductCard.tsx` |
| **Prompt 2** | Page Transition UX | #1 (loading/toploader) | `layout.tsx` (modify) + 3 new `loading.tsx` files |
| **Prompt 3** | Wishlist Saved Posts | #4 (saved posts) | `wishlist/page.tsx` |

Run prompts in **any order** — they are fully independent of each other.

---

## TypeScript / Code Standards
- No `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration
