# Customer UX Fixes — Agent Prompts (March 2026)

3 sequential prompts for a Gemini agent. Run them in **any order** — they are independent.

---

## PROMPT 1 — Code Fixes (Bell, Breadcrumbs, ProductCard)

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 App Router project at `asf-2-next/src/`.
Stack: TypeScript strict, Tailwind CSS, react-icons, Supabase.

Coding rules (mandatory):
- No `any` type, no `!` non-null assertion, no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will modify **4 files**. Return the complete updated content of each file.

---

### FILE 1 — `asf-2-next/src/components/home/HomeHighlightsCard.tsx`

**Current content:**
```tsx
import React from "react";
import Link from "next/link";
import MediaThumb from "../MediaThumb";
import { FaBell, FaBookmark, FaRegBookmark } from "react-icons/fa";

export interface HomeHighlightsCardProps {
  to: string;
  imageUrl?: string | null;
  title: string;
  subtitle: string;
  showBell?: boolean;
  onBellDismiss?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  imageAlt?: string;
  ctaText?: string;
  className?: string;
  fallbackImageUrl?: string;
}

function makePlaceholderImageUrl(text: string): string {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const FALLBACK_PLACEHOLDER_IMAGE = makePlaceholderImageUrl("Image");

function resolveImageUrl(imageUrl: string | null | undefined, fallbackImageUrl: string | undefined): string {
  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) return imageUrl;
  if (typeof fallbackImageUrl === "string" && fallbackImageUrl.trim().length > 0) return fallbackImageUrl;
  return FALLBACK_PLACEHOLDER_IMAGE;
}

export function HomeHighlightsCard({
  to, imageUrl, title, subtitle, showBell, onBellDismiss, isSaved, onSave,
  imageAlt, ctaText = "Discover More →", className = "", fallbackImageUrl,
}: HomeHighlightsCardProps): JSX.Element {
  const resolvedImageUrl = resolveImageUrl(imageUrl, fallbackImageUrl);
  const resolvedAlt = typeof imageAlt === "string" && imageAlt.trim().length > 0 ? imageAlt : title;

  return (
    <Link
      href={to}
      className={["flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group", className].join(" ")}
      style={{ width: "17rem" }}
    >
      {showBell === true && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBellDismiss?.(e); }}
          aria-label="标记为已读"
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <FaBell size={13} />
        </button>
      )}

      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <MediaThumb src={resolvedImageUrl} alt={resolvedAlt} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      <div className="p-5 relative">
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">{subtitle}</p>
        <div className="mt-4 flex justify-between items-center">
          {onSave !== undefined ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(e); }}
              aria-label={isSaved === true ? "取消收藏" : "收藏"}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-gray-100"
            >
              {isSaved === true
                ? <FaBookmark size={13} className="text-indigo-600" />
                : <FaRegBookmark size={13} className="text-gray-400" />
              }
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs text-indigo-700 font-medium">{ctaText}</span>
        </div>
      </div>
    </Link>
  );
}
```

**Required change:**
In the bell `<button>`, change the `className` from:
`"absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"`
to:
`"absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"`

---

### FILE 2 — `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`

**Current content:** (read the full file at the path above before modifying)

The file currently starts with:
```tsx
"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
```

And has these two plain functions defined inside the component:
```tsx
const toggleLocalSaved = (key: string): void => {
  setLocalSavedItems((prev) => {
    const next = new Set<string>(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    try { localStorage.setItem("saved_items", JSON.stringify(Array.from(next))); } catch { }
    return next;
  });
};
```
and:
```tsx
const dismissBell = (id: string): void => {
  setDismissedBells((prev) => {
    const next = new Set<string>(prev);
    next.add(id);
    try { localStorage.setItem("dismissed_bells", JSON.stringify(Array.from(next))); } catch { }
    return next;
  });
};
```

And inside the first `ScrollableSection` renderItem, the inline post card bell button has:
```tsx
className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"
```

**Required changes (3 changes):**

**Change A — Add `useCallback` to React import:**
Change:
```tsx
import React, { useRef, useMemo, useEffect, useState } from "react";
```
to:
```tsx
import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
```

**Change B — Wrap `toggleLocalSaved` in `useCallback`:**
Change:
```tsx
const toggleLocalSaved = (key: string): void => {
  setLocalSavedItems((prev) => {
    const next = new Set<string>(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    try { localStorage.setItem("saved_items", JSON.stringify(Array.from(next))); } catch { }
    return next;
  });
};
```
to:
```tsx
const toggleLocalSaved = useCallback((key: string): void => {
  setLocalSavedItems((prev) => {
    const next = new Set<string>(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    try { localStorage.setItem("saved_items", JSON.stringify(Array.from(next))); } catch {
      // localStorage not available
    }
    return next;
  });
}, []);
```

**Change C — Wrap `dismissBell` in `useCallback`:**
Change:
```tsx
const dismissBell = (id: string): void => {
  setDismissedBells((prev) => {
    const next = new Set<string>(prev);
    next.add(id);
    try { localStorage.setItem("dismissed_bells", JSON.stringify(Array.from(next))); } catch { }
    return next;
  });
};
```
to:
```tsx
const dismissBell = useCallback((id: string): void => {
  setDismissedBells((prev) => {
    const next = new Set<string>(prev);
    next.add(id);
    try { localStorage.setItem("dismissed_bells", JSON.stringify(Array.from(next))); } catch {
      // localStorage not available
    }
    return next;
  });
}, []);
```

**Change D — Fix inline post card bell button colour:**
Find the bell button inside the inline post card (inside the first `ScrollableSection` with `title="精选推荐"`). Change its `className` from:
`"absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"`
to:
`"absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"`

---

### FILE 3 — `asf-2-next/src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`

**Current content:** (read the full file — it is 287 lines)

The file has a `return (` block starting with `<NavbarHome />` followed by a back button `<div>`, followed by a `<section>`. Inside the section, the first `<div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">` contains two children:
1. A `<div>` wrapping a double-nested `<nav aria-label="Breadcrumb">` block
2. The inline search bar `<div className="relative w-full md:max-w-sm">`
3. The filter/sort `<div className="flex items-center space-x-4">`

**Required change:**
Remove the first child entirely — the `<div>` that wraps the double-nested breadcrumb:
```tsx
<div>
  <nav className="flex" aria-label="Breadcrumb">
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        ... (all the breadcrumb li items)
      </ol>
    </nav>
  </nav>
</div>
```
Keep the search bar `<div>` and the filter/sort `<div>` exactly as-is.
Also remove the `Link` import if it becomes unused after this deletion (check if `Link` is used anywhere else in the file — it is NOT, so remove the `import Link from "next/link"` line).

---

### FILE 4 — `asf-2-next/src/components/home/ProductCard.tsx`

**Current content:**
```tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
import Image from "next/image";

interface ProductCardProps {
  product: Tables<"products">;
  mediaUrl: string;
  onImageLoad?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, mediaUrl, onImageLoad = () => {} }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useAuthContext();

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = isInWishlist(product.id);

  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
  };

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="w-full">
        <a href={`/product-details/${product.id}`}>
          <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
            <Image
              className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              src={mediaUrl || "/default-image.jpg"}
              alt={product.name || "商品"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={handleImageReady}
              onError={handleImageReady}
            />
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
          </div>
          <div className="p-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
              RM {product.price}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
```

**Required changes:**

**Change A — Replace heart icons with bookmark icons:**
Change `import { FaHeart, FaRegHeart } from "react-icons/fa"` to
`import { FaBookmark, FaRegBookmark } from "react-icons/fa"`

**Change B — Remove the overlay heart button from the image area:**
Remove the entire `<button>` element with `className="absolute top-2 left-2 z-10..."` from inside the image `<div>`.

**Change C — Restructure the card footer to put the save button inline with name/price:**
Replace the current card footer:
```tsx
<div className="p-4">
  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
    {product.name}
  </h3>
  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
    RM {product.price}
  </p>
</div>
```
With:
```tsx
<div className="p-4">
  <div className="flex justify-between items-start gap-2">
    <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">
      {product.name}
    </h3>
    <button
      type="button"
      aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
      onClick={handleToggleWishlist}
      className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {isSaved
        ? <FaBookmark size={13} className="text-indigo-600" />
        : <FaRegBookmark size={13} className="text-gray-400 dark:text-gray-300" />
      }
    </button>
  </div>
  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 mt-1">
    RM {product.price}
  </p>
</div>
```

**Output:** Provide the complete updated content for all 4 files.

---

---

## PROMPT 2 — Page Transition UX (Loading Skeletons + Progress Bar)

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 App Router project at `asf-2-next/src/`.
Stack: TypeScript strict, Tailwind CSS, Flowbite React.

Coding rules (mandatory):
- No `any` type, no `!` non-null assertion
- Double quotes `"` for all strings
- Complete files — no placeholders

You will modify **1 existing file** and **create 4 new files**.

**Context — why this is needed:**
The app has no visual feedback during page navigation. In Next.js App Router,
server component pages fetch data before rendering. Without a `loading.tsx`, the
UI freezes silently until the fetch completes. `nextjs-toploader` adds a thin
progress bar at the top instantly on any navigation click.

---

### STEP 0 — Install package (run this terminal command first)
```
cd asf-2-next && npm install nextjs-toploader
```

---

### FILE 1 — Modify `asf-2-next/src/app/layout.tsx`

**Current content:**
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "../context/AlertContext";
import { AuthProvider } from "../context/AuthContext";
import { AlertComponent } from "../components/AlertComponent";

export const metadata: Metadata = {
  title: "My App",
  description: "Customer shopping experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <AlertProvider>
          <AuthProvider>
            <AlertComponent />
            {children}
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
```

**Required changes:**
1. Add `import NextTopLoader from "nextjs-toploader"` at the top
2. Add `<NextTopLoader color="#4f46e5" showSpinner={false} />` as the **first child** inside `<body>`, before `<AlertProvider>`

---

### FILE 2 — Create `asf-2-next/src/app/(customer)/loading.tsx`

Create this new file. It is a **server component** (no `"use client"`).

It shows a pulse skeleton mimicking the home page structure:
- A tall gradient card placeholder (the wallet/points hero)
- 2 horizontal scroll section placeholders, each with 3 card skeletons

```tsx
export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-pulse">
      {/* Navbar skeleton */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between h-14">
          <div className="h-8 w-40 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="p-5 pt-8">
        {/* Hero card skeleton */}
        <div className="h-52 w-full bg-indigo-200 rounded-xl" />
      </div>

      <div className="pt-4 space-y-6">
        {/* Section skeleton — repeated twice */}
        {[1, 2].map((i) => (
          <div key={i} className="py-4">
            <div className="flex justify-between items-center mb-4 px-5">
              <div className="h-6 w-24 bg-gray-200 rounded-lg" />
              <div className="h-7 w-20 bg-gray-200 rounded-full" />
            </div>
            <div className="flex space-x-4 px-5 overflow-hidden">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex-shrink-0 w-[17rem] h-72 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### FILE 3 — Create `asf-2-next/src/app/(customer)/product-section/[[...categoryId]]/loading.tsx`

Create this new file. It mimics the product section grid layout.

```tsx
export default function ProductSectionLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-pulse">
      {/* Navbar skeleton */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between h-14">
          <div className="h-8 w-40 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Back button skeleton */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 pt-4 pb-12">
        {/* Search + filter row skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="h-10 w-full sm:max-w-sm bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        </div>

        {/* Product grid skeleton — 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="h-56 w-full bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### FILE 4 — Create `asf-2-next/src/app/(customer)/product-details/[productId]/loading.tsx`

Create this new file. It mimics the product detail page layout.

```tsx
export default function ProductDetailLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-pulse">
      {/* Navbar skeleton */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between h-14">
          <div className="h-8 w-40 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Back button skeleton */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>

      <div className="max-w-screen-xl px-4 mx-auto py-8 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Image skeleton */}
          <div className="aspect-square w-full max-w-md mx-auto bg-gray-200 rounded-lg" />

          {/* Info skeleton */}
          <div className="mt-6 lg:mt-0 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-10 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

**Output:** Provide the complete updated content of the modified `layout.tsx` and all 4 new `loading.tsx` files (full file content for each).

---

---

## PROMPT 3 — Wishlist Page: Saved Posts Section

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 App Router project at `asf-2-next/src/`.
Stack: TypeScript strict, Tailwind CSS, Flowbite React, Supabase.

Coding rules (mandatory):
- No `any` type, no `!` non-null assertion, no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will modify **1 file**. Return the complete updated content.

---

### Background

The customer home page allows users to save posts (highlights) by tapping a bookmark button.
These saves are stored in `localStorage` under the key `"saved_items"` as a JSON array of
strings in `"type:id"` format. Post saves look like: `"post:550e8400-e29b-41d4-a716-446655440000"`.

The wishlist page currently only shows products (backed by a Supabase `wishlist` DB table).
Saved posts are never shown anywhere. Users should see their saved posts at the top of the
wishlist page so they can revisit helpful content.

The Supabase browser client is imported as:
```ts
import { supabase } from "@/utils/supabaseClient";
```

The `posts` table has these relevant columns: `id`, `caption`, `cta_text`, `created_at`.
The `post_medias` table has: `id`, `post_id`, `media_url`.

---

### FILE — `asf-2-next/src/app/(customer)/wishlist/page.tsx`

**Current content:**
```tsx
"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Dropdown, Tooltip } from "flowbite-react";
import Link from "next/link";
import Image from "next/image";
import { HiDotsVertical, HiOutlineHeart, HiOutlineShoppingCart, HiOutlineTrash } from "react-icons/hi";
import NavbarHome from "@/components/navbar-home";
import { useAlertContext } from "@/context/AlertContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import type { ProductMedia } from "@/context/product/ProductMediaContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";
import { useAuthContext } from "@/context/AuthContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";

type SortBy = "addedOn" | "priceAsc" | "priceDesc" | "nameAsc" | "nameDesc";

interface DisplayWishlistItem {
  wishlistId: string;
  productId: string;
  name: string;
  price: number;
  category: string;
  addedOn: string;
  inStock: boolean;
  imageUrl: string;
}

const WishlistPage: React.FC = () => {
  const { showAlert } = useAlertContext();
  const { wishlistItems, loading, removeFromWishlist } = useWishlistContext();
  const { productMedias } = useProductMediaContext();
  const { categories } = useCategoryContext();

  const router = useRouter();
  const { user } = useAuthContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("addedOn");

  const primaryImageByProductId = useMemo<Record<string, string>>(() => {
    const record: Record<string, { url: string; arrangement: number }> = {};
    productMedias.forEach((media: ProductMedia) => {
      const productId = media.product_id;
      if (typeof productId !== "string" || productId.length === 0) return;
      if (typeof media.media_url !== "string" || media.media_url.length === 0) return;
      const arrangement = typeof media.arrangement === "number" ? media.arrangement : 0;
      const existing = record[productId];
      if (!existing || arrangement < existing.arrangement) {
        record[productId] = { url: media.media_url, arrangement };
      }
    });
    return Object.keys(record).reduce<Record<string, string>>((acc, key) => {
      acc[key] = record[key]?.url ?? "";
      return acc;
    }, {});
  }, [productMedias]);

  const categoryNameById = useMemo<Record<string, string>>(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const displayItems = useMemo<DisplayWishlistItem[]>(() => {
    return wishlistItems.map((item) => {
      const productId = item.product_id;
      if (typeof productId !== "string" || productId.length === 0) return null;
      const product = item.product;
      const name = typeof product?.name === "string" && product.name.length > 0 ? product.name : "未知商品";
      const price = typeof product?.price === "number" && Number.isFinite(product.price) ? product.price : 0;
      const categoryId = typeof product?.category_id === "string" ? product.category_id : null;
      const category = categoryId && typeof categoryNameById[categoryId] === "string" ? categoryNameById[categoryId] : "未分类";
      const addedOn = typeof item.created_at === "string" ? item.created_at : "";
      const inStock = typeof product?.stock_count === "number" ? product.stock_count > 0 : false;
      const imageUrl = typeof primaryImageByProductId[productId] === "string" && primaryImageByProductId[productId].length > 0
        ? primaryImageByProductId[productId] : "/default-image.jpg";
      return { wishlistId: item.id, productId, name, price, category, addedOn, inStock, imageUrl };
    }).filter((v): v is DisplayWishlistItem => v !== null);
  }, [categoryNameById, primaryImageByProductId, wishlistItems]);

  const categoryOptions = useMemo<string[]>(() => {
    const unique = new Set<string>();
    displayItems.forEach((item) => unique.add(item.category));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [displayItems]);

  const filteredItems = useMemo<DisplayWishlistItem[]>(() => {
    if (selectedCategory === "all") return displayItems;
    return displayItems.filter((item) => item.category === selectedCategory);
  }, [displayItems, selectedCategory]);

  const sortedItems = useMemo<DisplayWishlistItem[]>(() => {
    const items = filteredItems.slice();
    items.sort((a, b) => {
      switch (sortBy) {
        case "priceAsc": return a.price - b.price;
        case "priceDesc": return b.price - a.price;
        case "nameAsc": return a.name.localeCompare(b.name);
        case "nameDesc": return b.name.localeCompare(a.name);
        case "addedOn":
        default: {
          const aTime = a.addedOn ? new Date(a.addedOn).getTime() : 0;
          const bTime = b.addedOn ? new Date(b.addedOn).getTime() : 0;
          return bTime - aTime;
        }
      }
    });
    return items;
  }, [filteredItems, sortBy]);

  const formatDate = useCallback((dateString: string): string => {
    if (typeof dateString !== "string" || dateString.length === 0) return "未知";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "未知";
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }, []);

  const handleRemove = useCallback(async (productId: string): Promise<void> => {
    await removeFromWishlist(productId);
  }, [removeFromWishlist]);

  const handleAddToCartFromWishlist = useCallback(async (productId: string): Promise<void> => {
    if (!user) { router.push("/authentication/sign-in"); return; }
    const hasActiveColors = productColors.some((c) => c.product_id === productId && c.active === true && c.deleted_at === null);
    const hasActiveSizes = productSizes.some((s) => s.product_id === productId && s.active === true && s.deleted_at === null);
    if (hasActiveColors || hasActiveSizes) { router.push(`/product-details/${productId}`); return; }
    try {
      await createAddToCart({ product_id: productId, user_id: user.id, amount: 1, color_id: null, size_id: null });
      await createAddToCartLog({ product_id: productId, action_type: "add", amount: 1 });
      showAlert("已加入购物车", "success");
    } catch { showAlert("加入购物车失败，请重试", "error"); }
  }, [createAddToCart, createAddToCartLog, productColors, productSizes, router, showAlert, user]);

  const handleAddAllToCart = useCallback((): void => {
    showAlert("全部加入购物车功能尚未实现。", "error");
  }, [showAlert]);

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <HiOutlineHeart className="mr-2 h-7 w-7 text-red-500" />
                  我的收藏
                  <Badge color="gray" className="ml-3">{displayItems.length} 件商品</Badge>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">收藏您喜爱的商品，稍后再来查看</p>
              </div>
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                <div className="flex space-x-2">
                  <select className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category === "all" ? "全部" : category}</option>
                    ))}
                  </select>
                  <select className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                    <option value="addedOn">最新优先</option>
                    <option value="priceAsc">价格：从低到高</option>
                    <option value="priceDesc">价格：从高到低</option>
                    <option value="nameAsc">名称：A 到 Z</option>
                    <option value="nameDesc">名称：Z 到 A</option>
                  </select>
                </div>
                <Button color="blue" onClick={handleAddAllToCart} disabled={loading || displayItems.length === 0}>
                  <HiOutlineShoppingCart className="mr-2 h-5 w-5" />全部加入购物车
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-600 dark:text-gray-300">正在加载收藏...</div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 mb-4 text-gray-400"><HiOutlineHeart className="w-full h-full" /></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">您的收藏为空</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">添加到收藏的商品将在此处显示</p>
                <Link href="/product-section"><Button color="blue">开始购物</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <div key={item.wishlistId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <Link href={`/product-details/${item.productId}`}>
                        <div className="relative w-full h-48">
                          <Image src={item.imageUrl || "/default-image.jpg"} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2">
                        <Dropdown label={<HiDotsVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />} arrowIcon={false} inline>
                          <Dropdown.Item onClick={() => void handleRemove(item.productId)}>
                            <div className="flex items-center"><HiOutlineTrash className="mr-2 h-4 w-4" />移除</div>
                          </Dropdown.Item>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <Link href={`/product-details/${item.productId}`} className="hover:text-blue-600">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
                        </Link>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">添加于 {formatDate(item.addedOn)}</span>
                        <span className={["text-xs font-medium", item.inStock ? "text-green-600" : "text-red-600"].join(" ")}>{item.inStock ? "有货" : "缺货"}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">RM {item.price.toFixed(2)}</span>
                        <div>
                          {item.inStock ? (
                            <Button size="xs" color="blue" onClick={() => void handleAddToCartFromWishlist(item.productId)}>
                              <HiOutlineShoppingCart className="mr-1 h-4 w-4" />加入购物车
                            </Button>
                          ) : (
                            <Tooltip content="此商品目前缺货"><Button size="xs" color="gray" disabled>缺货</Button></Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default WishlistPage;
```

**Required changes — add a "saved posts" section above the existing product wishlist card:**

**Step 1 — Add new imports:**
```tsx
import { useEffect } from "react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { supabase } from "@/utils/supabaseClient";
import type { Tables } from "@/database.types";
```

**Step 2 — Add a type for saved post display:**
```tsx
interface SavedPost {
  id: string;
  caption: string | null;
  cta_text: string | null;
  mediaUrl: string;
}
```

**Step 3 — Add state and fetch logic inside the component (after existing state declarations):**
```tsx
const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
const [savedPostsLoading, setSavedPostsLoading] = useState<boolean>(false);

useEffect(() => {
  let isActive = true;

  const fetchSavedPosts = async (): Promise<void> => {
    try {
      const raw = localStorage.getItem("saved_items");
      const allSaved: string[] = raw !== null ? (JSON.parse(raw) as string[]) : [];
      const postIds = allSaved
        .filter((key) => key.startsWith("post:"))
        .map((key) => key.slice("post:".length))
        .filter((id) => id.length > 0);

      if (postIds.length === 0) {
        if (isActive) setSavedPosts([]);
        return;
      }

      setSavedPostsLoading(true);

      const [{ data: posts }, { data: postMedias }] = await Promise.all([
        supabase.from("posts").select("id, caption, cta_text").in("id", postIds),
        supabase.from("post_medias").select("post_id, media_url").in("post_id", postIds),
      ]);

      if (!isActive) return;

      const mediaByPostId = new Map<string, string>(
        (postMedias ?? [])
          .filter((m): m is { post_id: string; media_url: string } =>
            typeof m.post_id === "string" && typeof m.media_url === "string"
          )
          .map((m) => [m.post_id, m.media_url])
      );

      const result: SavedPost[] = (posts ?? []).map((post) => ({
        id: post.id,
        caption: post.caption ?? null,
        cta_text: post.cta_text ?? null,
        mediaUrl: mediaByPostId.get(post.id) ?? "/default-image.jpg",
      }));

      setSavedPosts(result);
    } catch {
      if (isActive) setSavedPosts([]);
    } finally {
      if (isActive) setSavedPostsLoading(false);
    }
  };

  void fetchSavedPosts();
  return () => { isActive = false; };
}, []);

const handleRemoveSavedPost = useCallback((postId: string): void => {
  try {
    const raw = localStorage.getItem("saved_items");
    const allSaved: string[] = raw !== null ? (JSON.parse(raw) as string[]) : [];
    const updated = allSaved.filter((key) => key !== `post:${postId}`);
    localStorage.setItem("saved_items", JSON.stringify(updated));
  } catch {
    // localStorage not available
  }
  setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
}, []);
```

**Step 4 — Add the saved posts section in the JSX, immediately before the existing `<Card className="mb-6">` product wishlist block:**

```tsx
{(savedPostsLoading || savedPosts.length > 0) && (
  <Card className="mb-6">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <FaBookmark className="text-indigo-600 h-5 w-5" />
      已保存的帖子
      {!savedPostsLoading && (
        <Badge color="indigo" className="ml-1">{savedPosts.length} 篇</Badge>
      )}
    </h2>

    {savedPostsLoading ? (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">加载中...</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedPosts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative">
              <Link href={`/highlights`}>
                <div className="relative w-full h-44">
                  <Image
                    src={post.mediaUrl}
                    alt={post.caption ?? "帖子"}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => handleRemoveSavedPost(post.id)}
                aria-label="取消收藏"
                className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FaBookmark size={14} className="text-indigo-600" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                {post.caption ?? "精选帖子"}
              </h3>
              {post.cta_text !== null && post.cta_text.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {post.cta_text}
                </p>
              )}
              <Link
                href="/highlights"
                className="mt-3 inline-block text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                查看帖子 →
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
)}
```

**Important notes for the agent:**
- `useEffect` and `FaBookmark`/`FaRegBookmark` and `supabase` and `Tables` need to be added to imports
- `useEffect` should be added to the existing React import: `import React, { useCallback, useMemo, useState, useEffect } from "react"`
- `Badge` is already imported from flowbite-react — use it for the post count badge with `color="indigo"`
- The `Tables` import may not be directly needed if you use inline types — only import if used
- `FaRegBookmark` is imported but only `FaBookmark` is used in the JSX above — only import what you use
- Keep ALL existing code exactly as-is; only add the new section

**Output:** Provide the complete updated content for `wishlist/page.tsx`.

---
