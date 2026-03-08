# Product Section Enhancements

## Overview

This document describes three UX improvements planned for the `/product-section` page of the customer-facing storefront. These features address feedback around perceived performance, product discoverability, and ease of purchase.

---

## Affected Files

| File | Change Type |
|---|---|
| `src/pages/landing/ProductSection.tsx` | Modified |
| `src/pages/landing/components/ProductCard.tsx` | **New file** (extracted from ProductSection) |

---

## Feature 1 — Full-Page Loading Animation

### Problem
When a user navigates to `/product-section`, the product grid renders progressively as images load from remote URLs. This results in visible layout jumps and images popping in one-by-one, which feels slow and broken.

### Solution
Block the entire page with a full-screen loading overlay until **both** conditions are satisfied:
1. Products have been fetched from Supabase (`loading === false` from `useProductContext`)
2. Every product image has either finished loading (`onLoad`) or failed (`onError`)

### How It Works

**Data loading phase:**
- `useProductContext()` already exposes a `loading: boolean`. While `true`, show skeleton cards.

**Image loading phase:**
- Once products are in memory, the product grid renders but is hidden (`opacity-0 pointer-events-none`).
- Each `<img>` fires `onLoad` or `onError`, which increments a counter tracked in a `useState<number>` in `ProductSection`.
- When `loadedCount >= products.length`, the overlay fades out and the grid fades in via CSS `transition-opacity duration-500`.
- Rendering hidden (not conditionally rendering) allows the browser to fetch all images in parallel while the spinner shows — so when the overlay disappears, everything is already ready.

**Loading overlay UI:**
- Full-screen `div` covering the section with the page's background colour (`bg-gray-50 dark:bg-gray-900`)
- Centred animated spinner (Tailwind `animate-spin` border-based circle)
- Optionally a brief label e.g. `加载中...`

---

## Feature 2 — "New" Product Badge

### Problem
Users cannot distinguish newly added products from existing inventory at a glance.

### Solution
Display a `新品` pill badge on the product image for any product created within the **last 30 days**, using the existing `created_at` field on the `products` table.

### How It Works
- Purely client-side — no DB changes needed.
- Threshold: `Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000`
- Badge is absolutely positioned on the **top-left** corner of the product image container.
- Styling: small green pill (`bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full`).
- Implemented inside the new `ProductCard` component.

---

## Feature 3 — Quick Add to Cart Icon

### Problem
Users on the `/product-section` listing page must navigate into each product's detail page just to add it to cart, creating unnecessary friction.

### Solution
Add a small shopping cart icon button on each product card. Tapping it either:
- **Directly adds the product to cart** (for products without colour/size variants)
- **Navigates to the product detail page** (for products that require variant selection)

### How It Works

**Variant detection:**
- `useProductColorContext()` exposes `productColors: ProductColor[]` — filter by `product_id` and check `active === true`
- `useProductSizeContext()` exposes `productSizes: ProductSize[]` — same filter
- If a product has ≥1 active colour **or** ≥1 active size → it has variants → navigate to detail page
- If no active variants → add directly to cart

**Auth guard:**
- If `user` from `useAuthContext()` is `null` → `navigate("/authentication/sign-in")`

**Cart insertion (no-variant products):**
```ts
await createAddToCart({
  product_id: product.id,
  user_id: user.id,
  amount: 1,
  color_id: null,
  size_id: null,
});
await createAddToCartLog({
  product_id: product.id,
  action_type: "add",
  amount: 1,
});
```

**UI:**
- Icon: `FaShoppingCart` from `react-icons/fa` (already used in `bottom-nav.tsx`)
- Position: absolute, bottom-right corner of the product image container
- Shows a small `animate-spin` spinner while the async call is in-flight (`useState<boolean>` for `isAdding`)
- On success: shows a brief green checkmark (optional, 1s) then reverts
- The entire card still links to the product detail page via the wrapping `<a>` tag; the button uses `e.stopPropagation()` / `e.preventDefault()` to avoid navigating on icon click

---

## Architecture Decision — Extract `ProductCard` Component

Both Feature 2 and Feature 3 require per-card state (`imageLoaded`, `isAdding`). To keep `ProductSection.tsx` clean, the card is extracted into `src/pages/landing/components/ProductCard.tsx`.

### `ProductCard` Props
```ts
interface ProductCardProps {
  product: Product;            // from ProductContext
  mediaUrl: string;            // pre-resolved media URL (or "/default-image.jpg")
  onImageLoad: () => void;     // callback to notify parent that this image loaded
}
```

The `onImageLoad` callback lets `ProductSection` track how many images have finished loading without needing to pass down a shared counter.

### Context Dependencies (inside ProductCard)
| Context | Hook | Used For |
|---|---|---|
| `AuthContext` | `useAuthContext()` | Get `user` for auth guard |
| `CartContext` | `useAddToCartContext()` | `createAddToCart()` |
| `AddToCartLogContext` | `useAddToCartLogContext()` | `createAddToCartLog()` |
| `ProductColorContext` | `useProductColorContext()` | Variant detection |
| `ProductSizeContext` | `useProductSizeContext()` | Variant detection |

All these providers are already mounted higher in the tree.

---

## Coding Standards (must follow)

- **TypeScript**: Strict mode, no `any`, no `!` non-null assertions, no `as unknown as T` casts.
- **Strings**: Double quotes `"`, use template literals instead of `+` concatenation.
- **Comments**: JSDoc headers on all functions; inline comments on key logic steps.
- **Error checking**: Validate inputs, guard against `undefined` before use.
- **No placeholders**: All generated code must be complete and runnable.

---

## Implementation Order

These features are split into **2 agent tasks** (see `PRODUCT_SECTION_AGENT_PROMPTS.md`):

| Agent | Task | Features Covered |
|---|---|---|
| Agent 1 | Display layer | Loading animation, "New" badge, extract `ProductCard`, image fade-in |
| Agent 2 | Interaction layer | Add to cart icon + logic inside `ProductCard` |

Agent 2 must be run **after** Agent 1 completes, as it modifies the `ProductCard` component created by Agent 1.
