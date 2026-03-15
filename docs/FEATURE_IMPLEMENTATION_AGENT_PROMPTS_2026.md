# Feature Implementation — Agent Prompts 2026

**Companion Plan**: `FEATURE_IMPLEMENTATION_PLAN_2026.md`  
**Date**: March 2026  
**Model**: Gemini 2.5 Pro (High)  
**Total Agents**: 4  
**Project Path**: `e:\Dev\GitHub\asf-2-next`

---

## Context for ALL Agents (Read This First)

You are working on a **Next.js 14 App Router** project located at `e:\Dev\GitHub\asf-2-next`.  
Do **NOT** touch the original CRA project at `e:\Dev\GitHub\asf-2`.

### Tech Stack
- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS + Flowbite React 0.7.5
- Supabase JS v2 for backend
- React Context API for global state
- `react-icons` for icons (Hi = Heroicons, Fa = Font Awesome)

### Critical Coding Rules (Enforce Without Exception)
1. `"use client"` at the very top of any file using `useState`, `useEffect`, `useContext`, event handlers, or browser APIs
2. **No `any` type** — define explicit TypeScript interfaces/types
3. **No non-null assertion operator (`!`)** — use optional chaining or conditional guards
4. **No `as unknown as T`** casting
5. **Double quotes** for all strings (`"like this"`, not `'like this'`)
6. **String templates** (`` `${value}` ``) instead of `+` concatenation
7. **Full inline JSDoc comments** on all functions and interfaces
8. **Error handling** on every async function
9. **Complete code only** — no placeholder comments like `// TODO` or `// implement later`
10. **Tailwind only** for styling — `style={}` only for truly dynamic values (percentages, pixel calculations)

### Supabase Clients
- **Browser client** (for client components/contexts): `import { supabase } from "@/utils/supabaseClient"`
- **Server client** (for `page.tsx` server components): `import { createSupabaseServerClient } from "@/utils/supabase/server"`

### Path Alias
All imports use `@/` which maps to `src/`. Example: `import { useAuthContext } from "@/context/AuthContext"`

---

---

## Agent 1 — Fix Add to Cart in `/product-section`

### Your Task

Fix the broken "Add to Cart" button on the `/product-section` product grid by adding two missing context providers to the customer layout wrapper.

**This is a single-file change in `RouteContextBundles.tsx`.**

---

### Background

The customer-facing layout (`src/app/(customer)/layout.tsx`) uses `SlimLandingContextBundle` from `src/context/RouteContextBundles.tsx` as its context wrapper.

The `ProductCard` component (`src/components/home/ProductCard.tsx`) calls two hooks:
```ts
const { productColors } = useProductColorContext();
const { productSizes } = useProductSizeContext();
```

But `ProductColorProvider` and `ProductSizeProvider` are **not** included in `SlimLandingContextBundle`. This causes both hooks to throw "must be used within a provider" errors at runtime, breaking the add-to-cart flow.

---

### File to Read First

Read the entire file at:
```
src/context/RouteContextBundles.tsx
```

---

### Exact Change Required

In `SlimLandingContextBundle`, add `ProductSizeProvider` and `ProductColorProvider` wrapping around `ProductMediaProvider`. They are already imported at the top of the file (used in `ProductContextBundle`).

The nesting order must be:
```
CategoryProvider
  ProductCategoryProvider
    ProductSizeProvider       ← ADD THIS
      ProductColorProvider    ← ADD THIS
        ProductMediaProvider
          ProductProvider
            ...
```

**Do not change any other bundle.** Only modify `SlimLandingContextBundle`.

---

### Verification

After the change, `SlimLandingContextBundle` should include `ProductSizeProvider` and `ProductColorProvider` in its JSX tree, wrapping `ProductMediaProvider`. The opening and closing tags must be properly nested and balanced.

---

### Files to Modify

| File | Change |
|---|---|
| `src/context/RouteContextBundles.tsx` | Add `ProductSizeProvider` and `ProductColorProvider` into `SlimLandingContextBundle` |

---

---

## Agent 2 — Save / Wishlist Buttons

### Your Task

Wire up the existing `WishlistContext` to three places in the UI:
1. Add a heart/save toggle button to **`ProductCard`** (shown on `/product-section`)
2. Add a heart/save toggle button to **`ProductDetailsClient`** (shown on `/product-details/[productId]`)
3. Fix the disabled **"Add to Cart" button on the Wishlist page** (`wishlist/page.tsx`)

---

### Background

`WishlistContext` (`src/context/WishlistContext.tsx`) is already fully implemented and available in `SlimLandingContextBundle`. It exposes:

```typescript
interface WishlistContextProps {
  wishlistItems: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}
```

Use: `import { useWishlistContext } from "@/context/WishlistContext"`

---

### Files to Read Before Starting

Read these files in full before making changes:

1. `src/components/home/ProductCard.tsx`
2. `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`
3. `src/app/(customer)/wishlist/page.tsx`
4. `src/context/WishlistContext.tsx` (to understand the API)
5. `src/context/product/CartContext.tsx` (to understand `createAddToCart`)
6. `src/context/product/AddToCartLogContext.tsx` (to understand `createAddToCartLog`)

---

### Change 1 — `ProductCard.tsx`

**Location**: `src/components/home/ProductCard.tsx`

Add a wishlist heart toggle button to the product image overlay.

**New imports to add:**
```typescript
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
```

**New logic inside the component (add after existing `useProductSizeContext` line):**

```typescript
const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
const isSaved = isInWishlist(product.id);
```

**New handler function (add after `handleAddToCart`):**

```typescript
/**
 * Toggles the wishlist state for this product.
 * Redirects to sign-in if the user is not authenticated.
 */
const handleToggleWishlist = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
  e.preventDefault();
  e.stopPropagation();

  if (user === null) {
    router.push("/authentication/sign-in");
    return;
  }

  if (isSaved) {
    await removeFromWishlist(product.id);
  } else {
    await addToWishlist(product.id);
  }
};
```

**New button in JSX** — place it inside the image `div`, at `absolute top-2 left-2 z-10` (the cart button is already at `bottom-2 right-2`):

```tsx
<button
  type="button"
  aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
  onClick={handleToggleWishlist}
  className="absolute top-2 left-2 z-10 flex items-center justify-center h-9 w-9 rounded-full shadow-md bg-white dark:bg-gray-800 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-gray-700"
>
  {isSaved
    ? <FaHeart size={14} className="text-red-500" />
    : <FaRegHeart size={14} className="text-gray-500 dark:text-gray-300" />
  }
</button>
```

---

### Change 2 — `ProductDetailsClient.tsx`

**Location**: `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`

Add a wishlist toggle button near the product title.

**New imports to add:**
```typescript
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
```

**New logic (add after existing context hooks at the top of the component):**
```typescript
const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
const isSaved = product !== null ? isInWishlist(product.id) : false;
```

**New handler (add after `beforeBuyNow`):**
```typescript
/**
 * Toggles the wishlist state for the current product.
 * Redirects to sign-in if the user is not authenticated.
 */
const handleToggleWishlist = useCallback(async (): Promise<void> => {
  if (!product) return;
  if (!user?.id) {
    router.push("/authentication/sign-in");
    return;
  }
  if (isSaved) {
    await removeFromWishlist(product.id);
  } else {
    await addToWishlist(product.id);
  }
}, [addToWishlist, isSaved, product, removeFromWishlist, router, user?.id]);
```

**New JSX button** — place it directly after the `<h1>` product name heading, before the article number metadata block:

```tsx
<button
  type="button"
  onClick={() => void handleToggleWishlist()}
  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
>
  {isSaved
    ? <FaHeart size={16} className="text-red-500" />
    : <FaRegHeart size={16} />
  }
  {isSaved ? "已收藏" : "收藏"}
</button>
```

---

### Change 3 — `wishlist/page.tsx`

**Location**: `src/app/(customer)/wishlist/page.tsx`

The "Add to Cart" button on each wishlist item is currently disabled with a tooltip. Fix it to actually add the product to cart (or redirect to product details if variants are required).

**New imports to add:**
```typescript
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
```

**New context hooks (add inside the component, after existing hooks):**
```typescript
const router = useRouter();
const { user } = useAuthContext();
const { createAddToCart } = useAddToCartContext();
const { createAddToCartLog } = useAddToCartLogContext();
const { productColors } = useProductColorContext();
const { productSizes } = useProductSizeContext();
```

**New handler (add after `handleRemove`):**
```typescript
/**
 * Adds a wishlist item to the cart.
 * If the product has active color or size variants, redirects to the
 * product detail page so the user can select them first.
 */
const handleAddToCartFromWishlist = useCallback(
  async (productId: string): Promise<void> => {
    if (!user) {
      router.push("/authentication/sign-in");
      return;
    }

    const hasActiveColors = productColors.some(
      (c) => c.product_id === productId && c.active === true && c.deleted_at === null
    );
    const hasActiveSizes = productSizes.some(
      (s) => s.product_id === productId && s.active === true && s.deleted_at === null
    );

    if (hasActiveColors || hasActiveSizes) {
      router.push(`/product-details/${productId}`);
      return;
    }

    try {
      await createAddToCart({
        product_id: productId,
        user_id: user.id,
        amount: 1,
        color_id: null,
        size_id: null,
      });
      await createAddToCartLog({
        product_id: productId,
        action_type: "add",
        amount: 1,
      });
      showAlert("已加入购物车", "success");
    } catch {
      showAlert("加入购物车失败，请重试", "error");
    }
  },
  [createAddToCart, createAddToCartLog, productColors, productSizes, router, showAlert, user]
);
```

**Update the existing "Add to Cart" button in JSX:**

Find the existing disabled button with the `<Tooltip>` wrapper that says "购物车流程与收藏列表分开" and replace the entire `<Tooltip>` + `<Button>` block with:

```tsx
{item.inStock ? (
  <Button
    size="xs"
    color="blue"
    onClick={() => void handleAddToCartFromWishlist(item.productId)}
  >
    <HiOutlineShoppingCart className="mr-1 h-4 w-4" />
    加入购物车
  </Button>
) : (
  <Button size="xs" color="gray" disabled>
    缺货
  </Button>
)}
```

Note: Remove the `<Tooltip>` import if it's no longer used elsewhere in the file.

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/home/ProductCard.tsx` | Add wishlist toggle button |
| `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx` | Add wishlist toggle button |
| `src/app/(customer)/wishlist/page.tsx` | Fix disabled add-to-cart button |

---

---

## Agent 3 — Search (Global Overlay + Inline in Product Section)

### Your Task

Implement search in two places:
1. **Global search overlay** — a full-screen overlay opened by a search icon in `NavbarHome`
2. **Inline search bar** — a text input inside `ProductSectionClient` that filters the product grid in real time

---

### Files to Read Before Starting

1. `src/components/navbar-home.tsx` — understand current navbar structure
2. `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx` — understand current filter/sort logic
3. `src/context/product/ProductContext.tsx` — to understand what `useProductContext` exposes (you need `products` array)
4. `src/context/product/ProductMediaContext.tsx` — to understand what `useProductMediaContext` exposes (you need `productMedias` array)

---

### Change 1 — New file: `SearchOverlay.tsx`

**Create**: `src/components/SearchOverlay.tsx`

This is a full-screen search overlay component.

**Props interface:**
```typescript
interface SearchOverlayProps {
  /** Whether the overlay is currently visible */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
}
```

**Behaviour:**
- When `isOpen` becomes `true`, the input auto-focuses (use `useRef` + `useEffect`)
- Pressing `Escape` closes the overlay (add a `keydown` listener in `useEffect`)
- Clicking the semi-transparent backdrop closes the overlay
- Products come from `useProductContext()` — `{ products }`
- Product media comes from `useProductMediaContext()` — `{ productMedias }`
- Build a `productMediaMap: Map<string, string>` from `productMedias` using `useMemo`
- `searchQuery` state starts as `""`
- `results` is `useMemo` — filters `products` where `product.name`, `product.description`, or `product.article_number` contains `searchQuery` (case-insensitive). Return empty array when `searchQuery.trim()` is `""`.
- Limit displayed results to **20 items** to avoid rendering too many nodes
- Each result row: product thumbnail image (40×40px), product name, price in `RM X.XX` format
- Clicking a result calls `router.push(`/product-details/${product.id}`)` then `onClose()`

**Layout structure:**
```
fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900
  ┌─ Top bar (px-4 py-3 border-b) ─────────────────────────────┐
  │  [🔍 icon]  [input: auto-focused, full width]  [✕ button]  │
  └─────────────────────────────────────────────────────────────┘
  ┌─ Results area (flex-1 overflow-y-auto) ────────────────────┐
  │  [Result row 1]                                             │
  │  [Result row 2]                                             │
  │  ...                                                        │
  │  [Empty state when no results]                              │
  └─────────────────────────────────────────────────────────────┘
```

**Icons to use:**
- `FaSearch` from `react-icons/fa` — in the input prefix
- `HiX` from `react-icons/hi` — for the close button

**Empty state text** (when query is non-empty but no results): `"未找到与 "${searchQuery}" 相关的商品"`

**Initial state text** (when query is empty): `"输入商品名称开始搜索"` — centered in the results area, gray text

---

### Change 2 — `navbar-home.tsx`

**Location**: `src/components/navbar-home.tsx`

Add a search icon button to the navbar and wire it to `SearchOverlay`.

**New imports:**
```typescript
import { FaSearch } from "react-icons/fa";
import SearchOverlay from "./SearchOverlay";
```

**New state:**
```typescript
const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
```

**New JSX in the navbar bar** — add the search button between the logo `<Link>` and the hamburger `<button>`. The three elements should be in a `flex items-center gap-2` or `space-x-2` row:

```tsx
{/* Search button */}
<button
  type="button"
  onClick={() => setIsSearchOpen(true)}
  aria-label="搜索商品"
  className="flex items-center justify-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
>
  <FaSearch className="w-5 h-5" />
</button>
```

**Add `SearchOverlay` render** — place it at the very bottom of the returned JSX (after `<BottomNavbar />`):

```tsx
<SearchOverlay
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
/>
```

---

### Change 3 — `ProductSectionClient.tsx`

**Location**: `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`

Add an inline search bar that further filters `filteredProducts`.

**New state (add near the top, with other `useState` calls):**
```typescript
const [searchQuery, setSearchQuery] = useState<string>("");
```

**Update `filteredProducts` useMemo** — after the existing sort logic, add a search filter step. Change from returning the sorted array directly to:

```typescript
const filteredProducts = useMemo(() => {
  const afterFiltersAndSort = products
    .filter((product) => {
      // ... existing category/department/range/brand filter logic (keep as-is) ...
    })
    .sort((a, b) => {
      // ... existing sort logic (keep as-is) ...
    });

  // Apply search query on top of existing filters
  if (searchQuery.trim().length === 0) {
    return afterFiltersAndSort;
  }
  const query = searchQuery.trim().toLowerCase();
  return afterFiltersAndSort.filter((product) => {
    const name = (product.name ?? "").toLowerCase();
    const articleNumber = (product.article_number ?? "").toLowerCase();
    return name.includes(query) || articleNumber.includes(query);
  });
}, [products, selectedCategory, departmentId, rangeId, brandId, selectedSort, searchQuery]);
```

**New JSX — search input** — place it between the breadcrumb nav `</div>` and the sort/filter `<div className="flex items-center space-x-4">`. Add it as a full-width input row:

```tsx
{/* Inline search bar */}
<div className="relative w-full md:max-w-sm">
  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  </div>
  <input
    type="search"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="搜索商品..."
    className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
  />
</div>
```

**Empty state** — update or add below the product grid: if `filteredProducts.length === 0` and `searchQuery.trim()` is non-empty, show:

```tsx
{filteredProducts.length === 0 && (
  <div className="col-span-2 py-16 text-center">
    <p className="text-gray-500 dark:text-gray-400 text-sm">
      {searchQuery.trim().length > 0
        ? `未找到与 "${searchQuery}" 相关的商品`
        : "此分类暂无商品"}
    </p>
  </div>
)}
```

---

### Files to Create/Modify

| File | Change |
|---|---|
| `src/components/SearchOverlay.tsx` | **CREATE** — full-screen search overlay component |
| `src/components/navbar-home.tsx` | Add search icon button + render `SearchOverlay` |
| `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx` | Add inline search bar + update `filteredProducts` memo |

---

---

## Agent 4 — Announcement Bottom Sheet Modal

### Your Task

Implement an announcement modal that slides up from the bottom of the screen on the home page. It is driven by a new `announcements` table in Supabase.

This task involves:
1. Adding the `announcements` type to `database.types.ts`
2. Creating `AnnouncementContext.tsx`
3. Creating `AnnouncementBottomSheet.tsx`
4. Wiring it into `RouteContextBundles.tsx` and `HomePageClient.tsx`

---

### Files to Read Before Starting

1. `src/database.types.ts` — to understand the existing pattern and where to add the new type
2. `src/context/WishlistContext.tsx` — as a reference for how to write a clean context with Supabase fetch
3. `src/context/RouteContextBundles.tsx` — to understand where to add the new provider
4. `src/app/(customer)/_components/HomePageClient.tsx` — to understand where to render the bottom sheet

---

### Change 1 — `database.types.ts`

**Location**: `src/database.types.ts`

Add the `announcements` table type definition. Find the `Tables` object in the `public` schema (it's an alphabetical list of tables). Insert the `announcements` entry **before** `add_to_cart_logs` (it comes first alphabetically), or after — just keep it consistent with the alphabetical order already in the file.

**Add this block inside `Tables`:**
```typescript
announcements: {
  Row: {
    id: string
    title: string
    message: string
    image_url: string | null
    cta_label: string | null
    cta_url: string | null
    type: string
    active: boolean
    starts_at: string | null
    ends_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    title: string
    message: string
    image_url?: string | null
    cta_label?: string | null
    cta_url?: string | null
    type?: string
    active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    title?: string
    message?: string
    image_url?: string | null
    cta_label?: string | null
    cta_url?: string | null
    type?: string
    active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    created_at?: string
  }
  Relationships: []
}
```

---

### Change 2 — New file: `AnnouncementContext.tsx`

**Create**: `src/context/AnnouncementContext.tsx`

```typescript
"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { supabase } from "@/utils/supabaseClient";
import type { Tables } from "@/database.types";

/** A single announcement row from the database */
export type AnnouncementRow = Tables<"announcements">;

/** localStorage key for tracking which announcement IDs have been dismissed */
const DISMISSED_KEY = "asf-dismissed-announcements";

/**
 * Reads the set of previously dismissed announcement IDs from localStorage.
 * Returns an empty Set if localStorage is unavailable (e.g. SSR).
 */
function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (typeof raw !== "string" || raw.length === 0) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

/**
 * Saves the set of dismissed announcement IDs to localStorage.
 */
function saveDismissedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Silently ignore storage errors (e.g. private browsing quota exceeded)
  }
}

/** Public API for the Announcement context */
export interface AnnouncementContextProps {
  /** The current active announcement, or null if none / dismissed */
  announcement: AnnouncementRow | null;
  /** Whether the fetch is in progress */
  loading: boolean;
  /**
   * Dismisses the announcement with the given ID for this session.
   * Stores the ID in localStorage so it won't show again on this device.
   */
  dismissAnnouncement: (id: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextProps | undefined>(undefined);

/**
 * AnnouncementProvider fetches the latest active announcement from Supabase
 * and exposes it via context. Dismissed announcements are tracked in localStorage.
 */
export function AnnouncementProvider({ children }: PropsWithChildren): JSX.Element {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /** Fetch the latest active announcement from Supabase */
  const fetchAnnouncement = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Silently ignore if the table doesn't exist yet (PGRST116 = no rows, 42P01 = table missing)
        if (process.env.NODE_ENV === "development") {
          console.warn("[AnnouncementContext] fetch error:", error.message);
        }
        setAnnouncement(null);
        return;
      }

      if (data === null) {
        setAnnouncement(null);
        return;
      }

      // Check if this announcement was already dismissed on this device
      const dismissed = getDismissedIds();
      if (dismissed.has(data.id)) {
        setAnnouncement(null);
        return;
      }

      setAnnouncement(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncement();
  }, [fetchAnnouncement]);

  /**
   * Dismisses an announcement by ID — persists to localStorage and clears state.
   */
  const dismissAnnouncement = useCallback((id: string): void => {
    const dismissed = getDismissedIds();
    dismissed.add(id);
    saveDismissedIds(dismissed);
    setAnnouncement(null);
  }, []);

  const value = useMemo<AnnouncementContextProps>(
    () => ({ announcement, loading, dismissAnnouncement }),
    [announcement, dismissAnnouncement, loading]
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
}

/**
 * Hook to access the Announcement context.
 * Must be used within an AnnouncementProvider.
 */
export function useAnnouncementContext(): AnnouncementContextProps {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncementContext must be used within an AnnouncementProvider");
  }
  return context;
}
```

---

### Change 3 — New file: `AnnouncementBottomSheet.tsx`

**Create**: `src/components/AnnouncementBottomSheet.tsx`

This component renders a bottom sheet modal with a 1500ms delay after mount.

**Complete implementation:**

```typescript
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HiX } from "react-icons/hi";
import { useAnnouncementContext } from "@/context/AnnouncementContext";

/**
 * AnnouncementBottomSheet displays the current active announcement from
 * AnnouncementContext as a slide-up bottom sheet modal.
 *
 * - Appears after a 1500ms delay to avoid interfering with page load.
 * - Dismissed state is persisted to localStorage via AnnouncementContext.
 * - Shows an optional image, title, message, and CTA button.
 */
const AnnouncementBottomSheet: React.FC = () => {
  const { announcement, dismissAnnouncement } = useAnnouncementContext();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  /**
   * Delay appearance by 1500ms after the component mounts.
   * Only trigger if an announcement is actually available.
   */
  useEffect(() => {
    if (announcement === null) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [announcement]);

  /**
   * When the announcement changes (e.g. dismissed then a new one loads),
   * reset the visible state.
   */
  useEffect(() => {
    if (announcement === null) {
      setIsVisible(false);
    }
  }, [announcement]);

  /** Dismiss and hide the sheet */
  const handleDismiss = (): void => {
    if (announcement === null) return;
    setIsVisible(false);
    // Small delay so the close animation completes before state is cleared
    setTimeout(() => {
      dismissAnnouncement(announcement.id);
    }, 300);
  };

  // Don't render anything if there's no announcement
  if (announcement === null) return null;

  /** Determine the accent colour based on announcement type */
  const accentColor: string = (() => {
    switch (announcement.type) {
      case "promo": return "bg-yellow-500";
      case "warning": return "bg-orange-500";
      default: return "bg-indigo-600";
    }
  })();

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black transition-opacity duration-300 ${
          isVisible ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className={`
          fixed bottom-0 left-0 right-0 z-[95]
          bg-white dark:bg-gray-900
          rounded-t-2xl shadow-2xl
          transform transition-transform duration-300 ease-out
          max-w-lg mx-auto
          ${isVisible ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Accent bar at the top of the sheet */}
        <div className={`h-1 w-full rounded-t-2xl ${accentColor}`} />

        {/* Drag handle visual cue */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭公告"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="px-5 pb-8 pt-2">
          {/* Optional image banner */}
          {typeof announcement.image_url === "string" && announcement.image_url.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={announcement.image_url}
                alt={announcement.title}
                className="w-full h-40 object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Title */}
          <h2
            id="announcement-title"
            className="text-lg font-bold text-gray-900 dark:text-white mb-2"
          >
            {announcement.title}
          </h2>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
            {announcement.message}
          </p>

          {/* CTA button — only rendered if cta_url and cta_label are provided */}
          {typeof announcement.cta_url === "string" &&
            announcement.cta_url.length > 0 &&
            typeof announcement.cta_label === "string" &&
            announcement.cta_label.length > 0 && (
              <Link
                href={announcement.cta_url}
                onClick={handleDismiss}
                className={`
                  block w-full py-3 px-6 rounded-xl text-center text-white text-sm font-semibold
                  transition-opacity hover:opacity-90 active:opacity-80
                  ${accentColor}
                `}
              >
                {announcement.cta_label}
              </Link>
            )}

          {/* Dismiss text link */}
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-3 block w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            不再提示
          </button>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBottomSheet;
```

---

### Change 4 — `RouteContextBundles.tsx`

**Location**: `src/context/RouteContextBundles.tsx`

Add `AnnouncementProvider` to `SlimLandingContextBundle`.

**New import (add at the top with other imports):**
```typescript
import { AnnouncementProvider } from "./AnnouncementContext";
```

**Update `SlimLandingContextBundle`** — wrap the outermost existing provider (e.g. `BrandProvider`) with `AnnouncementProvider`:

```tsx
export const SlimLandingContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <AnnouncementProvider>      {/* ← ADD THIS WRAPPER */}
    <BrandProvider>
      {/* ... all existing providers unchanged ... */}
    </BrandProvider>
  </AnnouncementProvider>     {/* ← AND THIS CLOSING TAG */}
);
```

---

### Change 5 — `HomePageClient.tsx`

**Location**: `src/app/(customer)/_components/HomePageClient.tsx`

Render `AnnouncementBottomSheet` inside the home page so it only appears on the home page (not on every page).

**New import:**
```typescript
import AnnouncementBottomSheet from "@/components/AnnouncementBottomSheet";
```

**Update the return JSX** — add `<AnnouncementBottomSheet />` as the very last child inside the `<LandingLayout>` wrapper:

```tsx
return (
  <LandingLayout>
    {/* ... all existing content unchanged ... */}

    {/* Announcement bottom sheet modal — appears after 1.5s delay */}
    <AnnouncementBottomSheet />
  </LandingLayout>
);
```

---

### Supabase Table (SQL for admin to run)

The following SQL must be run in Supabase SQL Editor to create the table. **This is for your reference — do NOT run it in code, just include it as a comment or note:**

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  message     text        NOT NULL,
  image_url   text,
  cta_label   text        DEFAULT '立即查看',
  cta_url     text,
  type        text        DEFAULT 'info' CHECK (type IN ('info', 'promo', 'warning')),
  active      boolean     NOT NULL DEFAULT true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) — public read for active announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active announcements"
ON announcements FOR SELECT
USING (active = true);
```

---

### Files to Create/Modify

| File | Change |
|---|---|
| `src/database.types.ts` | Add `announcements` table type block |
| `src/context/AnnouncementContext.tsx` | **CREATE** — new context with Supabase fetch + localStorage dismiss |
| `src/components/AnnouncementBottomSheet.tsx` | **CREATE** — bottom sheet modal component |
| `src/context/RouteContextBundles.tsx` | Wrap `SlimLandingContextBundle` with `AnnouncementProvider` |
| `src/app/(customer)/_components/HomePageClient.tsx` | Add `<AnnouncementBottomSheet />` at end of `LandingLayout` |

---

---

## Execution Order

```
Agent 1  (cart fix)          → Run first — no dependencies
Agent 2  (wishlist)          → Run after Agent 1 (needs fixed color/size contexts)
Agent 3  (search)            → Can run in parallel with Agent 2
Agent 4  (announcement)      → Can run in parallel with Agent 2 and 3
```

## After All Agents Complete

1. Run the SQL from Agent 4 in the Supabase SQL Editor to create the `announcements` table
2. Start the dev server: `cd e:\Dev\GitHub\asf-2-next && npm run dev`
3. Test add-to-cart on `/product-section`
4. Test wishlist heart button on a product card and product detail page
5. Test search overlay (search icon in navbar) and inline search bar in `/product-section`
6. Insert a test row into `announcements` with `active = true` and verify the bottom sheet appears on the home page after ~1.5 seconds
