# Product Section Enhancement — Agent Prompts

Two sequential agent tasks. Run **Agent 1 first**, then **Agent 2**.

---

## AGENT 1 — Display Layer (Loading Animation, New Badge, ProductCard Extraction)

### Prompt

You are working on a React + TypeScript e-commerce storefront that uses Tailwind CSS and Flowbite React components. Your task is to enhance the `/product-section` page with a full-page loading animation, a "新品" (New) product badge, and to extract the product card into its own reusable component. You must NOT implement any cart logic in this task — that comes in a separate task.

---

### Strict Coding Rules (follow every one, no exceptions)

1. Generate **full, complete code** — no placeholders, no "// TODO" stubs, no omitted sections.
2. Use **strict TypeScript** — no `any` type, no `!` non-null assertion operator, no `as unknown as T` casts. Define new types/interfaces as needed.
3. Use **double quotes** for all strings. Use template literals instead of `+` string concatenation.
4. Include **JSDoc comment headers** on every function/component, and **inline comments** explaining non-obvious logic.
5. Implement **error checking and type validation** where applicable.

---

### Context — Current File: `src/pages/landing/ProductSection.tsx`

This is the **entire current file** you will be modifying:

```tsx
import { Select } from "flowbite-react";
import React, { useEffect, useState } from "react";
import NavbarHome from "../../components/navbar-home";
import { useCategoryContext } from "../../context/product/CategoryContext";
import { useProductContext } from "../../context/product/ProductContext";
import { useProductMediaContext } from "../../context/product/ProductMediaContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const ProductSection: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useCategoryContext();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((category) => category.id === categoryId)
  );
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const query = new URLSearchParams(location.search);
  const departmentId = query.get("department");
  const rangeId = query.get("range");
  const brandId = query.get("brand");
  const [selectedFilter, setSelectedFilter] = useState(
    selectedCategory?.name || "All"
  );

  useEffect(() => {
    const category = categories.find((c) => c.id === categoryId);
    setSelectedCategory(category);
    if (departmentId || rangeId || brandId) {
      setSelectedFilter("All");
    } else {
      setSelectedFilter(category?.name || "All");
    }
  }, [categories, categoryId, departmentId, rangeId, brandId]);

  const handleFilterChange = (filterName: string) => {
    setSelectedFilter(filterName);
    if (filterName === "All") {
      navigate("/product-section");
      setSelectedCategory(undefined);
    } else {
      const category = categories.find((cat) => cat.name === filterName);
      if (category) {
        navigate(`/product-section/${category.id}`);
        setSelectedCategory(category);
      }
    }
  };

  return (
    <>
      <NavbarHome />
      <section className="bg-gray-50 antialiased dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 pt-4 pb-12">
          {/* Heading & Filters */}
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                      <a
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white">
                        <svg
                          className="me-2.5 h-3 w-3"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                        </svg>
                        首页
                      </a>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-400 rtl:rotate-180"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m9 5 7 7-7 7"
                          />
                        </svg>
                        <a
                          href="/product-section"
                          className="ms-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white md:ms-2">
                          商品
                        </a>
                      </div>
                    </li>
                    {selectedCategory && (
                      <li aria-current="page">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-gray-400 rtl:rotate-180"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m9 5 7 7-7 7"
                            />
                          </svg>
                          <span className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ms-2">
                            {selectedCategory.name}
                          </span>
                        </div>
                      </li>
                    )}
                  </ol>
                </nav>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!departmentId && !rangeId && !brandId && (
                <Select
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto">
                  <option value="All">全部</option>
                  {categories.map((filter) => (
                    <option key={filter.id} value={filter.name}>
                      {filter.name}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto">
                <option value="Price: Low to High">价格：从低到高</option>
                <option value="Price: High to Low">价格：从高到低</option>
                <option value="Newest First">最新优先</option>
              </Select>
            </div>
          </div>

          {/* Product Cards */}
          <div className="mb-4 grid gap-4 grid-cols-2">
            {products
              .filter((product) => {
                if (selectedCategory) {
                  return product.category_id === selectedCategory.id;
                }
                if (departmentId && departmentId !== "all") {
                  return product.department_id === departmentId;
                }
                if (rangeId && rangeId !== "all") {
                  return product.range_id === rangeId;
                }
                if (brandId && brandId !== "all") {
                  return product.brand_id === brandId;
                }
                return true;
              })
              .sort((a, b) => {
                if (selectedSort === "Price: Low to High") {
                  return a.price - b.price;
                } else if (selectedSort === "Price: High to Low") {
                  return b.price - a.price;
                } else {
                  return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                  );
                }
              })
              .map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="w-full">
                    <a href={`/product-details/${product.id}`}>
                      <img
                        className="mx-auto h-56 w-full object-cover rounded-t-lg"
                        src={
                          productMedias.find(
                            (media) => media.product_id === product.id
                          )?.media_url || "/default-image.jpg"
                        }
                        alt={"商品"}
                      />
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
              ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductSection;
```

---

### Context — Relevant Type: `Product`

From `src/context/product/ProductContext.tsx`:

```ts
// database.types.ts Row for products includes:
// id: string
// name: string
// price: number
// description: string | null
// created_at: string   ← use this for "New" badge
// category_id: string | null
// department_id: string | null
// range_id: string | null
// brand_id: string | null
// deleted_at: string | null

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  medias: ProductMedia[];
  product_categories: ProductCategory[];
  product_colors: ProductColor[];
  product_sizes: ProductSize[];
  stock_status: string;
  stock_count: number;
};

// Hook:
// const { products, loading } = useProductContext();
// loading is true while fetching from Supabase
```

---

### What You Must Build

#### 1. Create `src/pages/landing/components/ProductCard.tsx`

This is a new file. It is a **display-only** component in this task — no cart logic yet (that's added in a later task).

**Props interface:**
```ts
interface ProductCardProps {
  product: Product;       // the product data
  mediaUrl: string;       // resolved image URL (pass "/default-image.jpg" as fallback)
  onImageLoad: () => void; // call this when the image finishes loading (onLoad OR onError)
}
```

**What it renders:**
- A card `div` styled with `rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800`
- An image container `div` with `relative overflow-hidden rounded-t-lg` — this is the positioning parent
- The `<img>` tag:
  - Starts with `opacity-0` class
  - On `onLoad`: sets local `imageLoaded` state to `true`, calls `props.onImageLoad()`, removes `opacity-0`
  - On `onError`: same (treat failed image same as loaded — don't block forever)
  - Apply `transition-opacity duration-300` for a smooth fade in
  - A grey placeholder background (`bg-gray-200 dark:bg-gray-700`) behind the image while it loads
- **"新品" badge**: rendered as an absolutely positioned pill on the top-left corner of the image container, but **only** if `Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000`. Style: `bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full absolute top-2 left-2 z-10`
- Below the image: product name (`h3`) and price (`p`) in a `p-4` div
- The entire card content (image + text below) should be wrapped in an `<a href={/product-details/${product.id}}>` link

**State needed:**
```ts
const [imageLoaded, setImageLoaded] = useState<boolean>(false);
```

**Note**: Leave a `{/* CART_BUTTON_PLACEHOLDER */}` comment inside the image container `div` at the bottom-right — a future task will replace this with the cart button. Do NOT add any cart functionality yourself.

---

#### 2. Modify `src/pages/landing/ProductSection.tsx`

**New state to add:**
```ts
const { products, loading: productsLoading } = useProductContext();
const [loadedImageCount, setLoadedImageCount] = useState<number>(0);
```

**Compute whether page is ready:**
```ts
// filteredProducts is the result of .filter().sort() on products
// Page is ready when data loaded AND all visible images have fired onLoad/onError
const isPageReady: boolean = !productsLoading && loadedImageCount >= filteredProducts.length;
```

**Reset image counter when filter/sort changes** (so the overlay re-appears if the user changes category):
```ts
useEffect(() => {
  setLoadedImageCount(0);
}, [selectedCategory, selectedSort, selectedFilter, departmentId, rangeId, brandId]);
```

**Loading overlay** — render this when `!isPageReady`:
```tsx
{!isPageReady && (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    {/* Animated spinner */}
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
  </div>
)}
```

**Product grid visibility** — wrap the grid `div` with conditional opacity:
```tsx
<div className={`mb-4 grid gap-4 grid-cols-2 transition-opacity duration-500 ${isPageReady ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
```

**Replace inline card markup** with the new `<ProductCard>` component:
```tsx
.map((product) => {
  const mediaUrl = productMedias.find((m) => m.product_id === product.id)?.media_url ?? "/default-image.jpg";
  return (
    <ProductCard
      key={product.id}
      product={product}
      mediaUrl={mediaUrl}
      onImageLoad={() => setLoadedImageCount((prev) => prev + 1)}
    />
  );
})
```

**Import** the new component at the top of the file:
```ts
import ProductCard from "./components/ProductCard";
```

**Edge case**: if `filteredProducts.length === 0` and `!productsLoading`, treat as ready immediately (no images to wait for).

---

### Output Expected

- `src/pages/landing/components/ProductCard.tsx` — new file, complete
- `src/pages/landing/ProductSection.tsx` — updated file, complete

Do NOT modify any other files. Do NOT add cart functionality. Leave the `{/* CART_BUTTON_PLACEHOLDER */}` comment in the image container.

---
---

## AGENT 2 — Interaction Layer (Add to Cart Icon)

> ⚠️ **Run this AFTER Agent 1 has completed.** This task modifies `ProductCard.tsx` created by Agent 1.

### Prompt

You are working on a React + TypeScript e-commerce storefront using Tailwind CSS, Flowbite React, and `react-icons`. Your task is to add an "Add to Cart" icon button to the product cards on the `/product-section` listing page, by modifying the `ProductCard` component that was built in a previous task.

---

### Strict Coding Rules (follow every one, no exceptions)

1. Generate **full, complete code** — no placeholders, no "// TODO" stubs, no omitted sections.
2. Use **strict TypeScript** — no `any` type, no `!` non-null assertion operator, no `as unknown as T` casts. Define new types/interfaces as needed.
3. Use **double quotes** for all strings. Use template literals instead of `+` string concatenation.
4. Include **JSDoc comment headers** on every function/component, and **inline comments** explaining non-obvious logic.
5. Implement **error checking and type validation** where applicable.

---

### Context — Existing `ProductCard.tsx` Structure

After Agent 1's task, `src/pages/landing/components/ProductCard.tsx` looks like this (abridged structure — read the actual file before editing):

```tsx
// Props:
interface ProductCardProps {
  product: Product;
  mediaUrl: string;
  onImageLoad: () => void;
}

// Inside the image container div there is this comment:
// {/* CART_BUTTON_PLACEHOLDER */}
// ← This is where you add the cart button
```

You must **replace** the `{/* CART_BUTTON_PLACEHOLDER */}` comment with the actual cart button implementation.

---

### Context — Relevant Hooks and Types

#### AuthContext (`src/context/AuthContext.tsx`)
```ts
import { useAuthContext } from "../../../context/AuthContext";
// Usage:
const { user } = useAuthContext();
// user is: { id: string, email: string, ... } | null
// If null, user is not logged in
```

#### CartContext (`src/context/product/CartContext.tsx`)
```ts
import { useAddToCartContext, AddToCartInsert } from "../../../context/product/CartContext";
// Usage:
const { createAddToCart } = useAddToCartContext();
// createAddToCart signature:
// createAddToCart(addToCart: AddToCartInsert): Promise<void>
// AddToCartInsert = { product_id: string; user_id: string; amount?: number; color_id?: string | null; size_id?: string | null; }
```

#### AddToCartLogContext (`src/context/product/AddToCartLogContext.tsx`)
```ts
import { useAddToCartLogContext, AddToCartLogInsert } from "../../../context/product/AddToCartLogContext";
// Usage:
const { createAddToCartLog } = useAddToCartLogContext();
// createAddToCartLog(log: AddToCartLogInsert): Promise<void>
// AddToCartLogInsert = { product_id: string; action_type: string; amount: number; }
```

#### ProductColorContext (`src/context/product/ProductColorContext.tsx`)
```ts
import { useProductColorContext, ProductColor } from "../../../context/product/ProductColorContext";
// Usage:
const { productColors } = useProductColorContext();
// productColors is ProductColor[] — flat list of all product colour rows
// ProductColor has: id, product_id, color (string), active (boolean), deleted_at (string | null)
// To check if THIS product has active colours:
// productColors.filter(c => c.product_id === product.id && c.active === true && c.deleted_at === null)
```

#### ProductSizeContext (`src/context/product/ProductSizeContext.tsx`)
```ts
import { useProductSizeContext, ProductSize } from "../../../context/product/ProductSizeContext";
// Usage:
const { productSizes } = useProductSizeContext();
// productSizes is ProductSize[] — flat list of all product size rows
// ProductSize has: id, product_id, size (string), active (boolean), deleted_at (string | null)
// To check if THIS product has active sizes:
// productSizes.filter(s => s.product_id === product.id && s.active === true && s.deleted_at === null)
```

#### useNavigate (`react-router-dom`)
```ts
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/authentication/sign-in");       // redirect to sign in
navigate(`/product-details/${product.id}`); // redirect to product detail
```

---

### Context — Icon Library

The project uses `react-icons`. Import the shopping cart icon like this:
```ts
import { FaShoppingCart } from "react-icons/fa";
```

For the loading spinner, use Tailwind's `animate-spin` on a small border div (no extra icon needed).

For the success checkmark, use:
```ts
import { FaCheck } from "react-icons/fa";
```

---

### What You Must Build

Modify **only** `src/pages/landing/components/ProductCard.tsx`.

#### New state to add inside `ProductCard`
```ts
// "idle" = default, "loading" = awaiting cart API, "done" = success (briefly shown), "error" = failed
type CartButtonState = "idle" | "loading" | "done" | "error";
const [cartState, setCartState] = useState<CartButtonState>("idle");
```

#### New handler to add
```ts
/**
 * Handles the quick Add to Cart button tap.
 * - Redirects unauthenticated users to sign-in.
 * - Navigates to product detail page if the product has active colour or size variants
 *   (variant selection is required before adding to cart).
 * - For variant-free products, inserts directly into the cart and logs the action.
 */
const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
  // Prevent the parent <a> link from navigating when the button is tapped
  e.preventDefault();
  e.stopPropagation();

  // Guard: already in progress
  if (cartState === "loading") return;

  // Guard: not logged in
  if (user === null) {
    navigate("/authentication/sign-in");
    return;
  }

  // Check if this product requires variant selection
  const hasActiveColors = productColors.some(
    (c) => c.product_id === product.id && c.active === true && c.deleted_at === null
  );
  const hasActiveSizes = productSizes.some(
    (s) => s.product_id === product.id && s.active === true && s.deleted_at === null
  );

  if (hasActiveColors || hasActiveSizes) {
    // Navigate to detail page for variant selection
    navigate(`/product-details/${product.id}`);
    return;
  }

  // No variants — add directly to cart
  setCartState("loading");
  try {
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
    setCartState("done");
    // Reset back to idle after 1.5s
    setTimeout(() => { setCartState("idle"); }, 1500);
  } catch {
    setCartState("error");
    setTimeout(() => { setCartState("idle"); }, 2000);
  }
};
```

#### Cart button JSX (replace the `{/* CART_BUTTON_PLACEHOLDER */}` comment)

```tsx
{/* Quick add-to-cart button — bottom-right of image */}
<button
  type="button"
  aria-label="加入购物车"
  onClick={handleAddToCart}
  className={`
    absolute bottom-2 right-2 z-10
    flex items-center justify-center
    h-9 w-9 rounded-full shadow-md
    transition-colors duration-200
    ${cartState === "done"
      ? "bg-green-500 text-white"
      : cartState === "error"
      ? "bg-red-500 text-white"
      : "bg-white text-gray-700 hover:bg-green-500 hover:text-white dark:bg-gray-800 dark:text-gray-300"
    }
  `}>
  {cartState === "loading" && (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
  )}
  {cartState === "done" && <FaCheck size={14} />}
  {(cartState === "idle" || cartState === "error") && <FaShoppingCart size={14} />}
</button>
```

#### New imports to add at the top of `ProductCard.tsx`
```ts
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { useAddToCartContext } from "../../../context/product/CartContext";
import { useAddToCartLogContext } from "../../../context/product/AddToCartLogContext";
import { useProductColorContext } from "../../../context/product/ProductColorContext";
import { useProductSizeContext } from "../../../context/product/ProductSizeContext";
```

#### New hooks to add inside the component
```ts
const navigate = useNavigate();
const { user } = useAuthContext();
const { createAddToCart } = useAddToCartContext();
const { createAddToCartLog } = useAddToCartLogContext();
const { productColors } = useProductColorContext();
const { productSizes } = useProductSizeContext();
```

---

### Output Expected

- `src/pages/landing/components/ProductCard.tsx` — updated file, complete (must include ALL existing code from Agent 1's output plus these additions)

Do NOT modify `ProductSection.tsx` or any other file.

---

### Important Notes

- The `<button>` is **inside** the `<a>` tag that wraps the whole card. The `e.preventDefault()` + `e.stopPropagation()` in the click handler ensures the link does not fire when the button is tapped.
- The `cartState` type is a local union type — define it inside the component file.
- The `setTimeout` calls return `ReturnType<typeof setTimeout>` — no need to track or clear them since the component is unlikely to unmount during a 1.5s window; but if you want to be safe, track the ref and clear in a `useEffect` cleanup.
- All these providers (`AddToCartProvider`, `AuthProvider`, `ProductColorProvider`, `ProductSizeProvider`, `AddToCartLogProvider`) are already mounted higher in the React tree — you only need to call the hooks.
