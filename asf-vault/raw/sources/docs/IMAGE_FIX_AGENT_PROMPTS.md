# Image Performance Fix — Agent Prompts

**Reference document:** `docs/IMAGE_PERFORMANCE_AUDIT.md`  
**Project type:** Create React App (React + TypeScript + Tailwind CSS + Supabase)  
**Note:** The project is on Supabase Free plan — do NOT use Supabase image transformation URLs (`/storage/v1/render/image/...`). All fixes are front-end only.

Run each prompt as a separate agent task in order. Each task is self-contained and does not depend on the next task being complete first — except Task 2, which depends on Task 1 (the `LazyImage` component must exist before it can be used).

---

## Task 1 — Create the Reusable `<LazyImage>` Component

**Context:**  
The app has 36+ `<img>` tags across 20+ files with no lazy loading, no skeleton placeholder, and no error fallback. Before any of those can be fixed, we need a single reusable component that enforces all best practices by default.

**Instructions:**

Read the following files to understand the project's TypeScript and styling conventions before writing code:
- `src/components/home/HomeHighlightsCard.tsx`
- `src/components/ui/` (check if this directory exists; if not, you will create it)
- `tailwind.config.js` or `tailwind.config.ts` (to confirm Tailwind is available)

Create a new file at `src/components/ui/LazyImage.tsx` with the following requirements. Adhere to strict TypeScript — no `any`, no `!`, no `unknown` casts. Use double quotes for strings. Include full JSDoc comments.

**The `LazyImage` component must:**

1. **Accept these props (define a strict `LazyImageProps` interface):**
   - `src: string` — the image source URL
   - `alt: string` — alt text (required for accessibility)
   - `className?: string` — CSS class names applied to the `<img>` element
   - `wrapperClassName?: string` — CSS class names applied to the outer wrapper `<div>`
   - `fallbackSrc?: string` — URL to use if the image fails to load; defaults to a grey SVG data URI
   - `fetchpriority?: "high" | "low" | "auto"` — native HTML fetch priority hint
   - `eager?: boolean` — when `true`, sets `loading="eager"` (for above-fold LCP images); defaults to `false` (lazy)
   - `width?: number | string` — passed through to `<img>`
   - `height?: number | string` — passed through to `<img>`
   - `style?: React.CSSProperties` — passed through to `<img>`
   - `onClick?: React.MouseEventHandler<HTMLImageElement>` — passed through to `<img>`

2. **Internal loading state:** Use a `useState<"loading" | "loaded" | "error">` to track image state.

3. **Shimmer skeleton while loading:**  
   When state is `"loading"`, render a `<div>` with `className="absolute inset-0 bg-gray-200 animate-pulse"` overlaid on top of the image. This gives the animated shimmer effect.

4. **Fade-in on load:**  
   The `<img>` element should start at `opacity-0` and transition to `opacity-100` when `onLoad` fires. Use a CSS transition: `transition-opacity duration-300 ease-in`.

5. **Error fallback:**  
   On `onError`, set state to `"error"` and swap the `src` to `fallbackSrc`. The default `fallbackSrc` should be a simple inline grey SVG data URI so no external request is needed:
   ```
   data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='54' font-size='12' text-anchor='middle' fill='%236b7280'%3ENo image%3C/text%3E%3C/svg%3E
   ```

6. **Native browser lazy loading:**  
   Use `loading={eager ? "eager" : "lazy"}` and `decoding="async"` on the `<img>` element.

7. **The wrapper `<div>`** must be `relative overflow-hidden` so the shimmer overlay positions correctly. Apply `wrapperClassName` to it.

8. **When `src` prop changes** (e.g., a new product is selected), reset state back to `"loading"` using a `useEffect` that watches `src`.

**Example expected usage after this task is done:**
```tsx
// Standard lazy image with shimmer
<LazyImage
  src={product.media_url}
  alt={product.name}
  className="w-full h-full object-cover"
  wrapperClassName="h-48"
/>

// LCP hero image — above the fold, high priority
<LazyImage
  src={heroImageUrl}
  alt="Featured Collection"
  className="w-full h-[75vh] object-cover"
  fetchpriority="high"
  eager
/>
```

Export the component as a **named export**: `export const LazyImage`.  
Also export `LazyImageProps` as a named type export.

Do not modify any other files in this task.

---

## Task 2 — Apply `LazyImage` to Landing Page Components: `HomeHighlightsCard`, `CategoryPreviewSidebar`, `Cart`, `Wishlist`

**Context:**  
These are high-traffic, shared components used across the customer-facing side of the app. They all contain bare `<img>` tags with no lazy loading. `HomeHighlightsCard` is used in bulk rows of 10–20 cards on the home page.

**Prerequisite:** Task 1 (the `LazyImage` component) must be completed first.

**Instructions:**

Read ALL of these files in full before making changes:
- `src/components/home/HomeHighlightsCard.tsx`
- `src/components/product/CategoryPreviewSidebar.tsx`
- `src/pages/landing/Cart.tsx`
- `src/pages/landing/Wishlist.tsx`
- `src/components/ui/LazyImage.tsx` (the component you created in Task 1)

For each file, apply the following changes:

### `HomeHighlightsCard.tsx`
- Import `LazyImage` from `../../ui/LazyImage` (adjust path to match actual location)
- Replace the `<img src={resolvedImageUrl} alt={resolvedAlt} className="..." />` with:
  ```tsx
  <LazyImage
    src={resolvedImageUrl}
    alt={resolvedAlt}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    wrapperClassName="absolute inset-0"
  />
  ```
- Remove the `resolveImageUrl` inline fallback logic from the `<img>` — `LazyImage` handles fallback via its `fallbackSrc` prop. Keep the `resolveImageUrl` helper function as-is since it resolves the primary `src`.

### `CategoryPreviewSidebar.tsx`
- Import `LazyImage`.
- Find the `<img src={image} alt={label} className="w-full h-full object-cover" />` tag.
- Replace with `<LazyImage src={image} alt={label} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />`.
- Ensure the outer container div retains its existing positioning/sizing classes.

### `Cart.tsx`
- Import `LazyImage`.
- Find the `<img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />` tag.
- Replace with `<LazyImage src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" wrapperClassName="w-full h-full" />`.

### `Wishlist.tsx`
- Import `LazyImage`.
- Find the `<img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />` tag.
- Replace with `<LazyImage src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" wrapperClassName="w-full" />`.

**Rules:**
- Do not change any logic, state, context usage, or non-image JSX in these files.
- Do not alter the existing Tailwind classes on non-image elements.
- Preserve all existing TypeScript types and props interfaces.
- Do not introduce any new dependencies — only use `LazyImage` from Task 1.

---

## Task 3 — Apply `LazyImage` to `Highlights.tsx` and `home.tsx` + Pre-build Media Maps

**Context:**  
`Highlights.tsx` renders 13+ full-size hero/banner images with no lazy loading and calls `postMedias.find()` 13 times in JSX. `home.tsx` does the same for products and posts. The hero images on both pages are LCP elements and must be marked `fetchpriority="high"`. All other images must be lazy.

**Prerequisite:** Task 1 must be completed first.

**Instructions:**

Read ALL of these files in full before making changes:
- `src/pages/landing/Highlights.tsx`
- `src/pages/landing/home.tsx`
- `src/components/ui/LazyImage.tsx`

### Changes for `Highlights.tsx`

**Step 1 — Pre-build a postMedia lookup Map:**  
After the existing `const { postMedias } = usePostMediaContext()` line, add:
```tsx
/** Pre-built O(1) lookup: post_id → media_url */
const postMediaMap = useMemo<Map<string, string>>(
  () => new Map(postMedias.map((m) => [m.post_id, m.media_url ?? ""])),
  [postMedias]
);
```
Add `useMemo` to the React import if it is not already there.

**Step 2 — Replace all `.find()` calls:**  
Every occurrence of:
```tsx
postMedias.find(media => media.post_id === featuredPosts[N].id)?.media_url
```
must be replaced with:
```tsx
postMediaMap.get(featuredPosts[N].id) ?? ""
```
Apply this to all 13 instances throughout the file.

**Step 3 — Replace `<img>` tags with `<LazyImage>`:**  
- The **first `<img>` tag** (the hero banner at the top of the page, `className="w-full h-[75vh] object-cover"`) must use `fetchpriority="high"` and `eager={true}`.
- All **other `<img>` tags** (section banners and grid images) must use `<LazyImage>` with default (lazy) loading.
- Preserve all existing Tailwind classes on the `<img>` element by passing them as `className` to `<LazyImage>`.
- The outer containers (the `<Link>` or `<div>` wrapping the `<img>`) retain their existing classes. Apply the image container's sizing class as `wrapperClassName` on `<LazyImage>` if the container is a bare div; otherwise nest `<LazyImage>` inside the existing container as before.

### Changes for `home.tsx`

**Step 1 — Pre-build a postMedia Map (if not already present):**  
In the component body (after context hooks), add:
```tsx
const postMediaMap = useMemo<Map<string, string>>(
  () => new Map(postMedias.map((m) => [m.post_id, m.media_url ?? ""])),
  [postMedias]
);
```

**Step 2 — Pre-build a productMedia Map (if not already present):**
```tsx
const productMediaMap = useMemo<Map<string, string>>(
  () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
  [productMedias]
);
```

**Step 3 — Replace image `src` resolution inline in JSX:**  
Replace any `.find()` calls for media lookup with the equivalent Map `.get()` call.

**Step 4 — Replace `<img>` tags with `<LazyImage>`:**  
- The **first hero/banner image** (if visible above the fold) must use `fetchpriority="high"` and `eager={true}`.
- All product card images, post card images, and promotional card images must use `<LazyImage>` with default lazy loading.

**Rules:**
- Do not change any non-image logic, state management, context usage, or scroll behaviour.
- Preserve all existing Tailwind classes by passing them through `className` prop.
- Do not rename any variables or restructure any component logic.

---

## Task 4 — Apply `LazyImage` to Stock Pages and Analytics Components

**Context:**  
The stock management pages (`list`, `overview`, `good-stocks`, `event-list`) and two analytics components (`ListWidget`, `ListPage`) all render product thumbnails without lazy loading. Additionally, `list.tsx`, `overview.tsx`, `good-stocks.tsx`, and `event-list.tsx` use the `flatMap(Array(N).fill(null))` anti-pattern that inflates image count by 10×.

**Prerequisite:** Task 1 must be completed first.

**Instructions:**

Read ALL of these files in full before making changes:
- `src/pages/stocks/list.tsx`
- `src/pages/stocks/overview.tsx`
- `src/pages/stocks/good-stocks.tsx`
- `src/pages/stocks/event-list.tsx`
- `src/components/analytics/ListWidget.tsx`
- `src/components/analytics/ListPage.tsx`
- `src/components/ui/LazyImage.tsx`

### For ALL four stock page files (`list.tsx`, `overview.tsx`, `good-stocks.tsx`, `event-list.tsx`):

**Step 1 — Fix the `flatMap(Array(N))` anti-pattern:**  
Find every instance of:
```tsx
array.flatMap((item) =>
  Array(N)
    .fill(null)
    .map((_, index) => (
      <div key={`${item.id}-${index}`}>...</div>
    ))
)
```
Replace with a simple `.map()`:
```tsx
array.map((item) => (
  <div key={item.id}>...</div>
))
```
The `key` should use only `item.id`, not `item.id-index`. Update any other code that relied on the duplicated data for display/testing purposes.

**Step 2 — Pre-build productMedia Map:**  
After the `useProductMediaContext()` hook call, add:
```tsx
const productMediaMap = useMemo<Map<string, string>>(
  () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
  [productMedias]
);
```
Add `useMemo` to the React import if not present.

**Step 3 — Replace `.find()` with Map lookup:**  
Replace every:
```tsx
productMedias.find((media) => media.product_id === item.product.id)?.media_url
```
with:
```tsx
productMediaMap.get(item.product.id) ?? ""
```
(Adjust the property access path to match what each file actually uses — `item.product.id`, `item.product_id`, etc.)

**Step 4 — Replace `<img>` with `<LazyImage>`:**  
Replace each `<img src={...} alt={...} className="w-16 h-16 object-cover rounded-md" />` with:
```tsx
<LazyImage
  src={productMediaMap.get(item.product.id) ?? ""}
  alt={item.product.name}
  className="w-16 h-16 object-cover rounded-md"
  wrapperClassName="w-16 h-16 flex-shrink-0"
/>
```

### For `ListWidget.tsx` and `ListPage.tsx`:

These analytics components already use a simple `.map()` (no `flatMap` anti-pattern). They just need:

1. Import `LazyImage`.
2. Replace the `<img className="h-9 w-9" src={data.media_url} alt={data.title} />` with:
   ```tsx
   <LazyImage
     src={data.media_url ?? ""}
     alt={data.title ?? ""}
     className="h-9 w-9 object-cover rounded"
     wrapperClassName="h-9 w-9 shrink-0"
   />
   ```
3. Remove the wrapping `{data.media_url && (...)}` conditional — `LazyImage` handles missing/empty `src` gracefully via its `fallbackSrc`.

**Rules:**
- Do not change routing (`navigate(...)` calls), badge logic, filter logic, or any non-image code.
- Preserve all existing Tailwind layout classes on parent containers.

---

## Task 5 — Apply `LazyImage` to Category Page, Landing Sub-components, and Support Pages

**Context:**  
The category management page has 16+ thumbnail images across departments/ranges/brands. The landing `Category.tsx` sub-component uses the `flatMap` anti-pattern with inline `.find()`. The support `CommunityView.tsx` renders community and group avatars.

**Prerequisite:** Task 1 must be completed first.

**Instructions:**

Read ALL of these files in full before making changes:
- `src/pages/products/category-page.tsx`
- `src/pages/landing/components/Category.tsx`
- `src/pages/landing/components/Product.tsx`
- `src/pages/support/CommunityView.tsx`
- `src/components/ui/LazyImage.tsx`

### `category-page.tsx`

This file has 16+ `<img>` tags rendering department, range, and brand thumbnails. They are all inside conditionals like `{d.media_url && (<img src={d.media_url} ... />)}` or `{file && (<img src={URL.createObjectURL(file)} ... />)}`.

1. Import `LazyImage`.
2. For all **list thumbnail images** (the `w-16 h-16` images in the departments/ranges/brands list):
   - Replace `<img src={d.media_url} ... />` with `<LazyImage src={d.media_url} ... wrapperClassName="w-16 h-16 flex-shrink-0" />`.
   - Keep the `{d.media_url && (...)}` conditional wrapper as-is.
3. For **preview images** (the ones shown after a file is selected for upload, or when editing an existing category/dept/range/brand):
   - These are single images shown in an edit panel. Replace with `<LazyImage>` but do **not** add the `wrapperClassName` with fixed dimensions — let the parent container (`mt-2` div) control sizing.
   - These are user-facing upload previews, so use `eager={true}` (show immediately when selected).
4. For `URL.createObjectURL(file)` images — these are local blob previews, they load instantly. Use `eager={true}` on these.
5. The illustration `<img src="/images/illustrations/404.svg" ...>` does **not** need `LazyImage` — it is a static SVG. Add `loading="lazy"` as a plain HTML attribute only.

### `landing/components/Category.tsx`

This component uses `flatMap(Array(10).fill(null).map(...))` and inline `.find()` for media resolution.

1. **Fix `flatMap` anti-pattern:** Replace with a simple `.map()`.
2. **Pre-build productMedia Map via `useMemo`:**
   ```tsx
   const productMediaMap = useMemo<Map<string, string>>(
     () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
     [productMedias]
   );
   ```
3. **Replace `.find()` with Map lookup** in the `src` attribute.
4. **Replace `<img>` with `<LazyImage>`:**
   ```tsx
   <LazyImage
     src={productMediaMap.get(product.id) ?? "/default-image.jpg"}
     alt={product.name ?? "Product"}
     className="absolute inset-0 w-full h-full object-cover"
     wrapperClassName="absolute inset-0"
   />
   ```

### `landing/components/Product.tsx`

This is a single-product detail component. It already has a skeleton loading state when `product` is null. 

1. Import `LazyImage`.
2. Replace the `<img src={productMedia[0]?.media_url || "/default-image.jpg"} ... />` with:
   ```tsx
   <LazyImage
     src={productMedia[0]?.media_url ?? "/default-image.jpg"}
     alt={product.name ?? "Product"}
     className="absolute inset-0 w-full h-full object-cover"
     wrapperClassName="absolute inset-0"
     fetchpriority="high"
     eager={true}
   />
   ```
   Mark this `fetchpriority="high"` and `eager` because it is the primary product hero image — it is always visible on render.

### `CommunityView.tsx`

1. Import `LazyImage`.
2. Replace the community avatar `<img className="w-12 h-12 rounded-full" ...>` with:
   ```tsx
   <LazyImage
     src={selectedCommunity?.avatar ?? "/images/users/community-avatar.png"}
     alt={selectedCommunity?.name ?? "Community"}
     className="w-12 h-12 rounded-full object-cover"
     wrapperClassName="w-12 h-12 rounded-full flex-shrink-0"
   />
   ```
3. Replace the group avatar `<img className="w-8 h-8 rounded-full" ...>` with:
   ```tsx
   <LazyImage
     src={group.avatar ?? "/images/users/group-avatar.png"}
     alt={group.name}
     className="w-8 h-8 rounded-full object-cover"
     wrapperClassName="w-8 h-8 rounded-full flex-shrink-0"
   />
   ```

**Rules:**
- Do not change tab state, selection logic, search filtering, or any non-image code in these files.
- Preserve all existing parent container classes.

---

## Task 6 — Fix Hardcoded Template Components and Add DNS Preconnect to `index.html`

**Context:**  
Two Flowbite template components (`cards-with-grid-layout-and-CTA.tsx`, `overlay-cards-with-zoom-effect.tsx`) contain a combined 18 hardcoded external S3 images with no lazy loading and no declared dimensions, causing layout shift. The `public/index.html` has no DNS preconnect hints, adding 100–300ms latency to the first image load from each origin.

**Instructions:**

Read ALL of these files in full before making changes:
- `src/components/home/cards-with-grid-layout-and-CTA.tsx`
- `src/components/home/overlay-cards-with-zoom-effect.tsx`
- `public/index.html`

### `cards-with-grid-layout-and-CTA.tsx` and `overlay-cards-with-zoom-effect.tsx`

These are static template components. They do not need the full `<LazyImage>` component — native HTML attributes are sufficient here.

For **every** `<img>` tag in both files, add the following attributes:
1. `loading="lazy"` — defers loading until near viewport
2. `decoding="async"` — moves decoding off the main thread
3. `width="320"` and `height="320"` — prevents layout shift (CLS) by reserving space. Use `320` as a safe default matching the `h-[320px]` already in the className.

Example transformation:
```tsx
// Before
<img
  className="object-cover w-full h-[320px] lg:h-auto scale-100 ease-in duration-300 group-hover:scale-125"
  src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/team/member-1.png"
  alt=""
/>

// After
<img
  className="object-cover w-full h-[320px] lg:h-auto scale-100 ease-in duration-300 group-hover:scale-125"
  src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/team/member-1.png"
  alt=""
  loading="lazy"
  decoding="async"
  width={320}
  height={320}
/>
```

Apply this to all `<img>` tags in both files. Do not change any other code.

### `public/index.html`

Locate the `<head>` section. After the existing `<meta>` tags and before `<title>`, add the following DNS preconnect and preconnect hints:

```html
<!-- Preconnect to Supabase Storage for faster first image load -->
<link rel="preconnect" href="https://gswszoljvafugtdikimn.supabase.co" crossorigin />
<link rel="dns-prefetch" href="https://gswszoljvafugtdikimn.supabase.co" />

<!-- Preconnect to Flowbite CDN (used by template components) -->
<link rel="preconnect" href="https://flowbite.s3.amazonaws.com" crossorigin />
<link rel="dns-prefetch" href="https://flowbite.s3.amazonaws.com" />
```

The Supabase URL `gswszoljvafugtdikimn.supabase.co` is confirmed in `src/utils/supabaseClient.ts`.

**Do not change anything else in `index.html`.**

---

## Verification Checklist

After all 6 tasks are complete, verify the following:

| Check | How to verify |
|---|---|
| No raw `<img>` tags in dynamic image contexts | Run: `grep -r "<img " src/ --include="*.tsx"` — remaining hits should only be static SVG illustrations or upload preview images with `eager={true}` |
| Shimmer visible on slow connections | Open DevTools → Network → throttle to "Slow 3G" → navigate to `/highlights` and `/` — you should see animated shimmer boxes before images load |
| Images fade in progressively | On throttled network, images should fade in one by one as they arrive, not all at once |
| No broken image icons | Temporarily corrupt a Supabase URL in the browser console and verify the grey fallback placeholder renders instead of a broken icon |
| Hero image loads first | In DevTools Network tab, the hero banner should appear in the waterfall before product thumbnails |
| LCP improvement | Run Lighthouse on `/highlights` before and after — LCP score should improve |
| `flatMap` anti-pattern removed | Open `/stocks` and `/` category rows in DevTools Elements panel — number of rendered image elements should match the number of data items, not 10× that |
