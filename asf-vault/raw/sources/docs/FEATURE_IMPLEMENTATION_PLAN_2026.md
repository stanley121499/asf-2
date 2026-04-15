# Feature Implementation Plan — 2026

**Project**: ASF-2 (Next.js — `asf-2-next`)  
**Date**: March 2026  
**Companion Prompts**: `FEATURE_IMPLEMENTATION_AGENT_PROMPTS_2026.md`  
**Total Agents**: 4  
**Model**: Gemini 2.5 Pro (High context)

---

## Overview

Four new customer-facing features are being added to the Next.js app located at `e:\Dev\GitHub\asf-2-next`. All work is done exclusively inside that folder. The original CRA project at `e:\Dev\GitHub\asf-2` is NOT touched.

### Features

1. **Add to Cart Fix** — Cart button in `/product-section` is silently broken due to missing context providers in the layout wrapper.
2. **Save / Wishlist** — Add heart/save buttons to `ProductCard` and `ProductDetailsClient` so users can wishlist products from the browsing flow.
3. **Search** — A global search overlay (via navbar icon) + inline search bar inside `/product-section`.
4. **Announcement Modal** — A bottom-sheet modal shown on the home page to announce new arrivals, sales, or news. Managed from Supabase via a new `announcements` table.

---

## Tech Stack (Inside `asf-2-next`)

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Flowbite React 0.7.5
- **Backend**: Supabase (Postgres + Realtime + Auth)
- **Icons**: `react-icons` (Hi prefix = Heroicons, Fa prefix = Font Awesome)
- **State**: React Context API (custom providers in `src/context/`)
- **String style**: Double quotes only (`"`)
- **All client components**: `"use client"` at the top of the file

---

## Directory Structure (Relevant Paths)

```
asf-2-next/src/
  app/
    (customer)/                   ← All customer-facing routes
      layout.tsx                  ← Uses SlimLandingContextBundle
      page.tsx                    ← Home page (server component)
      _components/
        HomePageClient.tsx        ← Home page client component
      product-section/
        [[...categoryId]]/
          page.tsx                ← Server component, fetches data
          _components/
            ProductSectionClient.tsx  ← Client component (MODIFIED)
      product-details/
        [productId]/
          _components/
            ProductDetailsClient.tsx  ← Client component (MODIFIED)
      wishlist/
        page.tsx                  ← Wishlist page (MODIFIED)
  components/
    navbar-home.tsx               ← Navbar on all customer pages (MODIFIED)
    home/
      bottom-nav.tsx              ← Bottom navigation bar
      ProductCard.tsx             ← Product card (MODIFIED)
  context/
    RouteContextBundles.tsx       ← Context provider wrappers (MODIFIED)
    WishlistContext.tsx           ← Wishlist logic (already complete)
    product/
      ProductColorContext.tsx     ← Provides productColors[]
      ProductSizeContext.tsx      ← Provides productSizes[]
  utils/
    supabaseClient.ts             ← Browser Supabase client
    supabase/
      server.ts                   ← Server-side Supabase client
  database.types.ts               ← Supabase type definitions (READ ONLY)
```

---

## Feature 1: Add to Cart Fix

### Problem

`ProductCard` (`src/components/home/ProductCard.tsx`) uses two hooks:
- `useProductColorContext()` — from `ProductColorContext`
- `useProductSizeContext()` — from `ProductSizeContext`

However, **neither `ProductColorProvider` nor `ProductSizeProvider`** are included in `SlimLandingContextBundle` (`src/context/RouteContextBundles.tsx`), which is the context wrapper used by `(customer)/layout.tsx`.

This means when `ProductCard` is rendered on the `/product-section` page, both context hooks throw (or return empty), causing the add-to-cart logic to fail silently.

### Fix

In `src/context/RouteContextBundles.tsx`, update `SlimLandingContextBundle` to wrap with both `ProductColorProvider` and `ProductSizeProvider`.

**Current** (simplified):
```tsx
export const SlimLandingContextBundle = ({ children }) => (
  <BrandProvider>
    <DepartmentProvider>
      <RangeProvider>
        <CategoryProvider>
          <ProductCategoryProvider>
            // ← ProductSizeProvider and ProductColorProvider are MISSING here
            <ProductMediaProvider>
              <ProductProvider>
                ...
```

**After fix** (simplified):
```tsx
export const SlimLandingContextBundle = ({ children }) => (
  <BrandProvider>
    <DepartmentProvider>
      <RangeProvider>
        <CategoryProvider>
          <ProductCategoryProvider>
            <ProductSizeProvider>           ← ADD
              <ProductColorProvider>        ← ADD
                <ProductMediaProvider>
                  <ProductProvider>
                    ...
                  </ProductProvider>
                </ProductMediaProvider>
              </ProductColorProvider>       ← ADD
            </ProductSizeProvider>          ← ADD
```

**Files changed**: `src/context/RouteContextBundles.tsx` only.

---

## Feature 2: Save / Wishlist Buttons

### Context Already Exists

`WishlistContext` (`src/context/WishlistContext.tsx`) is fully implemented and already provided in `SlimLandingContextBundle`. It exposes:
- `addToWishlist(productId: string): Promise<void>`
- `removeFromWishlist(productId: string): Promise<void>`
- `isInWishlist(productId: string): boolean`
- `loading: boolean`

### Changes Required

#### A. `ProductCard` (`src/components/home/ProductCard.tsx`)

Add a heart/bookmark toggle button overlaid on the product image (top-left corner, to avoid overlap with the existing cart button at bottom-right).

- Import `useWishlistContext`
- Import heart icons: `FaHeart` (filled, red) and `FaRegHeart` (outline, gray) from `react-icons/fa`
- Add a `handleToggleWishlist` async function that:
  - If user is null → redirect to `/authentication/sign-in`
  - If `isInWishlist(product.id)` → call `removeFromWishlist(product.id)`
  - Else → call `addToWishlist(product.id)`
- Render a circular button `absolute top-2 left-2 z-10` in the image div

#### B. `ProductDetailsClient` (`src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`)

Add a save button near the product name / price area.

- Import `useWishlistContext`
- Add a heart toggle button that calls the same wishlist methods
- Place it inline next to or below the product title (before the price)
- Show a filled heart + "已收藏" text when saved; outline heart + "收藏" when not saved

#### C. `wishlist/page.tsx` — Fix "Add to Cart" button

The wishlist page currently has a disabled "Add to Cart" button with tooltip "购物车流程与收藏列表分开". This is intentionally not implemented. Fix it by:

- Import `useAddToCartContext`, `useAddToCartLogContext`, `useAuthContext`
- Import `useProductColorContext`, `useProductSizeContext`
- For each wishlist item's "Add to Cart" button:
  - If product has active colors or sizes → `router.push('/product-details/[productId]')` (user must pick variant)
  - Otherwise → call `createAddToCart` + `createAddToCartLog` directly
- Remove the `<Tooltip>` wrapper and the `disabled` prop

---

## Feature 3: Search

### Two-Level Search Strategy

#### Level 1 — Global Search Overlay (in `NavbarHome`)

A full-screen overlay triggered by a search icon in the top navbar.

**UI flow:**
1. Search icon button in `NavbarHome` (between logo and hamburger menu icon)
2. Click → state `isSearchOpen` set to `true`
3. A full-screen overlay (`fixed inset-0 z-[100] bg-white`) appears with an auto-focused input
4. As the user types (debounced 150ms), results filter from the product list
5. Tapping a result navigates to `/product-details/[productId]` and closes overlay
6. ESC key or backdrop tap closes the overlay

**Data source**: `useProductContext()` — products are already in memory.

**Search fields**: `product.name`, `product.description`, `product.article_number` (case-insensitive substring match).

**New component to create**: `src/components/SearchOverlay.tsx`

**Changes to `NavbarHome`**:
- Add a `FaSearch` icon button in the navbar bar
- Add `isSearchOpen` state + pass into `SearchOverlay`

#### Level 2 — Inline Search in `/product-section`

A search bar added to `ProductSectionClient` that filters the already-computed `filteredProducts` list.

- Add `searchQuery` state (`useState<string>("")`)
- Add a text input above the product grid (or integrated with the filter/sort row)
- Apply `searchQuery` as a final filter on `filteredProducts` (after category/department/range/brand filters are applied)
- Match against `product.name` case-insensitively
- Show a "0 results" empty state if no matches

**Only `ProductSectionClient.tsx` is changed** for this level — no new files needed.

---

## Feature 4: Announcement Modal

### Database

A new `announcements` table must be created in Supabase. Add its type definition to `src/database.types.ts` manually (since we can't run Supabase CLI in this context).

**Table schema:**
```sql
CREATE TABLE announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  message      text NOT NULL,
  image_url    text,
  cta_label    text DEFAULT '立即查看',
  cta_url      text,
  type         text DEFAULT 'info' CHECK (type IN ('info', 'promo', 'warning')),
  active       boolean NOT NULL DEFAULT true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

### Context

Create `src/context/AnnouncementContext.tsx`:
- Fetches the single most-recent active announcement on mount using `supabase` client
- Filters: `active = true`, `starts_at <= now OR starts_at IS NULL`, `ends_at >= now OR ends_at IS NULL`
- Order by `created_at DESC`, `limit(1)`
- Exposes: `announcement`, `loading`, `dismissAnnouncement(id: string): void`
- Dismiss logic: stores dismissed `id` in `localStorage` under key `"asf-dismissed-announcements"`. If the fetched announcement's id is in that set, treat as `null`.

Add `AnnouncementProvider` to `SlimLandingContextBundle`.

### UI Component

Create `src/components/AnnouncementBottomSheet.tsx`:
- A bottom sheet modal (slides up from bottom via Tailwind `translate-y`)
- Appears with a 1500ms delay after mount
- Shows: optional image banner at top, title, message, optional CTA button
- ✕ button in top-right that calls `dismissAnnouncement(announcement.id)`
- Semi-transparent backdrop overlay
- Auto-dismissed if CTA is clicked (also calls dismiss)

### Integration

Add `<AnnouncementBottomSheet />` at the bottom of `HomePageClient.tsx` (renders after the main content, absolute positioning handles display).

---

## Agent Breakdown

| Agent | Features | Files Changed | Complexity |
|---|---|---|---|
| **Agent 1** | Add to Cart Fix | `RouteContextBundles.tsx` | Low |
| **Agent 2** | Save/Wishlist on ProductCard + ProductDetails + Wishlist page cart fix | `ProductCard.tsx`, `ProductDetailsClient.tsx`, `wishlist/page.tsx` | Medium |
| **Agent 3** | Search (Global overlay + Inline in product-section) | `navbar-home.tsx`, `SearchOverlay.tsx` (new), `ProductSectionClient.tsx` | Medium |
| **Agent 4** | Announcement Modal | `database.types.ts`, `AnnouncementContext.tsx` (new), `AnnouncementBottomSheet.tsx` (new), `RouteContextBundles.tsx`, `HomePageClient.tsx` | Medium-High |

**Dependency**: Agent 1 must run before Agent 2 (so wishlist add-to-cart uses fixed context). Agents 3 and 4 are independent and can run after Agent 1.

---

## Coding Standards (Enforced Across All Agents)

1. **No `any` type** — define explicit interfaces/types
2. **No non-null assertion (`!`)** — use optional chaining or runtime guards
3. **No `as unknown as T`** — use proper type narrowing
4. **Double quotes** for all strings
5. **String templates** (backtick literals) instead of `+` concatenation
6. **`"use client"`** at the top of every component using hooks, state, or event handlers
7. **Full JSDoc comments** on all functions and interfaces
8. **Error checking** on all async operations
9. **No placeholders** — complete, runnable code only
10. **Tailwind only** for styling — no inline `style={}` unless for dynamic values (e.g. `width: x%`)
