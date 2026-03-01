# Image Fix — Revert to Native Lazy Loading

**Goal:** Remove all `<LazyImage>` component usage and replace with plain `<img>` tags that have `loading="lazy"` and `decoding="async"`. This fixes the broken card layouts caused by the LazyImage wrapper div interfering with container sizing.

**What to KEEP from previous agent runs:**
- The `useMemo` media Map optimisations (e.g. `productMediaMap`, `postMediaMap`) — keep these, they are separate and correct.
- The `flatMap(Array(N).fill(null))` → `.map()` fixes — keep these too.
- The `public/index.html` preconnect hints — keep those.

**What to CHANGE:** Every file that imports and uses `<LazyImage>` — replace it with a plain `<img>` tag and add `loading="lazy"` and `decoding="async"`. The `LazyImage` component file itself (`src/components/ui/LazyImage.tsx`) can be left in place — just stop using it.

**Rules that apply to ALL tasks below:**
- Use double quotes for strings.
- Strict TypeScript — no `any`, no `!`, no `unknown` casts.
- Do not change any logic, state, context, routing, or non-image code.
- Do not remove or alter the `useMemo` media Maps or `.map()` fixes.
- For the `fetchPriority` attribute: write it as `fetchPriority` (camelCase) in JSX — React maps this to the correct HTML attribute.

---

## Task 1 — Revert Landing Components and Shared Card Components

Read ALL of these files in full before making any changes:
- `src/components/home/HomeHighlightsCard.tsx`
- `src/components/product/CategoryPreviewSidebar.tsx`
- `src/pages/landing/Cart.tsx`
- `src/pages/landing/Wishlist.tsx`

For each file, do the following:

### `HomeHighlightsCard.tsx`
1. Remove the `import { LazyImage } from "../ui/LazyImage";` line.
2. Find the `<LazyImage ... wrapperClassName="absolute inset-0" />` block inside the `<div className="h-48 bg-gray-100 relative">` container.
3. Replace the entire `<LazyImage>` with a plain `<img>` tag, preserving all original classes and attributes:
   ```tsx
   <img
     src={resolvedImageUrl}
     alt={resolvedAlt}
     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
     loading="lazy"
     decoding="async"
   />
   ```
4. The outer `<div className="h-48 bg-gray-100 relative">` container must remain exactly as-is.

### `CategoryPreviewSidebar.tsx`
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` tag and replace it with:
   ```tsx
   <img
     src={image}
     alt={label}
     className="w-full h-full object-cover"
     loading="lazy"
     decoding="async"
   />
   ```

### `Cart.tsx`
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` tag for cart item images and replace it with:
   ```tsx
   <img
     src={item.image}
     alt={item.name}
     className="w-full h-full object-cover rounded-md"
     loading="lazy"
     decoding="async"
   />
   ```

### `Wishlist.tsx`
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` tag for wishlist item images and replace it with:
   ```tsx
   <img
     src={item.imageUrl}
     alt={item.name}
     className="w-full h-48 object-cover"
     loading="lazy"
     decoding="async"
   />
   ```

---

## Task 2 — Revert `Highlights.tsx` and `home.tsx`

Read BOTH files in full before making any changes:
- `src/pages/landing/Highlights.tsx`
- `src/pages/landing/home.tsx`

### For both files:
1. Remove the `LazyImage` import line.
2. Find every `<LazyImage ... />` usage.
3. Replace each one with a plain `<img>` tag that:
   - Keeps the same `src` value (using the media Map lookup that was already added, e.g. `postMediaMap.get(...)`)
   - Keeps the same `alt` value
   - Keeps the same `className`
   - Adds `loading="lazy"` and `decoding="async"`
   - For the **first hero/banner image** (the one that was marked `eager` and `fetchpriority="high"`), instead use `loading="eager"` and `fetchPriority="high"`:
     ```tsx
     <img
       src={...}
       alt="..."
       className="w-full h-[75vh] object-cover"
       loading="eager"
       fetchPriority="high"
       decoding="async"
     />
     ```
   - For all other images below the fold, use `loading="lazy"`:
     ```tsx
     <img
       src={...}
       alt="..."
       className="..."
       loading="lazy"
       decoding="async"
     />
     ```
4. Do NOT remove the `postMediaMap` or `productMediaMap` `useMemo` blocks — those stay.
5. Do NOT alter any other JSX, state, or logic.

---

## Task 3 — Revert Stock Pages and Analytics Components

Read ALL of these files in full before making any changes:
- `src/pages/stocks/list.tsx`
- `src/pages/stocks/overview.tsx`
- `src/pages/stocks/good-stocks.tsx`
- `src/pages/stocks/event-list.tsx`
- `src/components/analytics/ListWidget.tsx`
- `src/components/analytics/ListPage.tsx`

### For all four stock page files:
1. Remove the `LazyImage` import.
2. Find every `<LazyImage>` for product thumbnails and replace with:
   ```tsx
   <img
     src={productMediaMap.get(item.product.id) ?? ""}
     alt={item.product.name}
     className="w-16 h-16 object-cover rounded-md"
     loading="lazy"
     decoding="async"
   />
   ```
   Adjust the property access path (`item.product.id`, `item.product_id`, etc.) to match what the specific file actually uses — do not change it, just preserve it.
3. Keep the `productMediaMap` `useMemo` block as-is.
4. Keep the `.map()` fix (do not reintroduce `flatMap(Array(N))`).

### For `ListWidget.tsx` and `ListPage.tsx`:
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` tag and replace with:
   ```tsx
   <img
     className="h-9 w-9 object-cover rounded"
     src={data.media_url ?? ""}
     alt={data.title ?? ""}
     loading="lazy"
     decoding="async"
   />
   ```
3. If the `{data.media_url && (...)}` conditional was removed previously, add it back:
   ```tsx
   {data.media_url && (
     <div className="shrink-0">
       <img
         className="h-9 w-9 object-cover rounded"
         src={data.media_url}
         alt={data.title ?? ""}
         loading="lazy"
         decoding="async"
       />
     </div>
   )}
   ```

---

## Task 4 — Revert Category Page, Landing Sub-components, and Support Pages

Read ALL of these files in full before making any changes:
- `src/pages/products/category-page.tsx`
- `src/pages/landing/components/Category.tsx`
- `src/pages/landing/components/Product.tsx`
- `src/pages/support/CommunityView.tsx`

### `category-page.tsx`
1. Remove the `LazyImage` import.
2. Find every `<LazyImage>` tag and replace it with a plain `<img>` with `loading="lazy"` and `decoding="async"`.
3. For list thumbnail images (the `w-16 h-16` ones), the replacement is:
   ```tsx
   <img
     src={d.media_url}
     alt={d.name ?? "Department"}
     className="w-16 h-16 object-cover rounded-md"
     loading="lazy"
     decoding="async"
   />
   ```
   Apply the same pattern for range and brand thumbnails, adjusting variable names.
4. For upload preview images (`URL.createObjectURL(file)` ones), use `loading="eager"` since they are locally generated and should show immediately.
5. Re-wrap each thumbnail image back inside its original `{d.media_url && (...)}` conditional if that was removed.

### `landing/components/Category.tsx`
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` and replace with:
   ```tsx
   <img
     src={productMediaMap.get(product.id) ?? "/default-image.jpg"}
     alt={product.name ?? "Product"}
     className="absolute inset-0 w-full h-full object-cover"
     style={{ display: "block" }}
     loading="lazy"
     decoding="async"
   />
   ```
3. Keep the outer `<div className="relative mb-4 overflow-hidden rounded-lg h-40">` container unchanged.
4. Keep the `productMediaMap` `useMemo` and the `.map()` fix — do not revert those.

### `landing/components/Product.tsx`
1. Remove the `LazyImage` import.
2. Find the `<LazyImage>` and replace with:
   ```tsx
   <img
     src={productMedia[0]?.media_url ?? "/default-image.jpg"}
     alt={product.name ?? "Product"}
     className="absolute inset-0 w-full h-full object-cover"
     style={{ display: "block" }}
     loading="eager"
     fetchPriority="high"
     decoding="async"
   />
   ```
   This is a hero product image — use `loading="eager"` and `fetchPriority="high"` since it is the primary visible element.

### `CommunityView.tsx`
1. Remove the `LazyImage` import.
2. Find the community avatar `<LazyImage>` and replace with:
   ```tsx
   <img
     src={selectedCommunity?.avatar ?? "/images/users/community-avatar.png"}
     alt={selectedCommunity?.name ?? "Community"}
     className="w-12 h-12 rounded-full"
     loading="lazy"
     decoding="async"
   />
   ```
3. Find the group avatar `<LazyImage>` and replace with:
   ```tsx
   <img
     src={group.avatar ?? "/images/users/group-avatar.png"}
     alt={group.name}
     className="w-8 h-8 rounded-full"
     loading="lazy"
     decoding="async"
   />
   ```
