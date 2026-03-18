# Customer UX Improvements — Agent Prompts (March 2026)

These are 4 sequential prompts to be passed to an AI coding agent (Gemini).
Run them **in order** — each prompt builds on the previous.

---

## PROMPT 1 — Cleanup Pass

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 app (App Router) located at `asf-2-next/src/`.
The app uses TypeScript (strict), Tailwind CSS, Flowbite React, Supabase, and react-icons.

You must follow these coding rules without exception:
- No `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Generate complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will make changes to **3 files**. Return the complete updated content of each file.

---

### FILE 1: `asf-2-next/src/components/navbar-home.tsx`

**Current content:**
```tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BottomNavbar from "./home/bottom-nav";
import CategoryPreviewSidebar from "./product/CategoryPreviewSidebar";
import { useCategoryContext, Category } from "../context/product/CategoryContext";
import { useDepartmentContext } from "../context/product/DepartmentContext";
import { useRangeContext } from "../context/product/RangeContext";
import { useBrandContext } from "../context/product/BrandContext";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { FaSearch } from "react-icons/fa";
import SearchOverlay from "./SearchOverlay";

const NavbarHome: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { categories, loading } = useCategoryContext();
  const { departments } = useDepartmentContext();
  const { ranges } = useRangeContext();
  const { brands } = useBrandContext();
  const [resultingCategories, setResultingCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!loading && categories.length > 0) {
      const buildHierarchy = (parentCategory: Category) => {
        const children = categories
          .filter((child) => child.parent === parentCategory.id)
          .sort((a, b) => {
            if (a.arrangement === null) return 1;
            if (b.arrangement === null) return -1;
            return a.arrangement - b.arrangement;
          });
        parentCategory.children = children;
        children.forEach(buildHierarchy);
      };

      const hierarchy = categories.filter((category) => !category.parent);
      hierarchy.forEach((category) => {
        buildHierarchy(category);
      });

      setResultingCategories([...hierarchy]);
    }
  }, [categories, loading]);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-none border-b dark:border-gray-700 transition-colors duration-200 px-4 py-2">
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="flex items-center">
            <img alt="Logo" src="../../images/logo.svg" className="mr-3 h-14" />
            <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              SYSTEM APP FORMULA
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="搜索商品"
              className="flex items-center justify-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
              <FaSearch className="w-5 h-5" />
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={toggleSidebar}
              type="button"
              className="flex items-center justify-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-label="打开分类菜单"
            >
              <HiOutlineMenuAlt3 className="w-7 h-7" />
              <span className="sr-only">打开分类</span>
            </button>
          </div>
        </div>
      </div>

      {!loading && (
        <CategoryPreviewSidebar
          departments={departments}
          ranges={ranges}
          brands={brands}
          categories={resultingCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
          }}
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
          isMobile={true}
          shouldRedirect={true}
          redirectUrlFormatter={(tab, item) => {
            if (tab === "department") return `/product-section?department=${item.id}`;
            if (tab === "range") return `/product-section?range=${item.id}`;
            if (tab === "brand") return `/product-section?brand=${item.id}`;
            return `/product-section/${(item as Category).id}`;
          }}
          slideFromLeft={true}
          fullWidth={true}
        />
      )}

      <BottomNavbar />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default NavbarHome;
```

**Required changes:**
1. Remove the search `<button>` element entirely (the one with `aria-label="搜索商品"`)
2. Remove `isSearchOpen` state variable
3. Remove `SearchOverlay` render at the bottom
4. Remove `FaSearch` import from `react-icons/fa`
5. Remove `SearchOverlay` import
6. Keep everything else exactly as-is

---

### FILE 2: `asf-2-next/src/components/home/ProductCard.tsx`

**Current content:**
```tsx
"use client";
import React, { useState } from "react";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
import type { Tables } from "@/database.types";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";
import Image from "next/image";

interface ProductCardProps {
  product: Tables<"products">;
  mediaUrl: string;
  onImageLoad?: () => void;
}

type CartButtonState = "idle" | "loading" | "done" | "error";

const ProductCard: React.FC<ProductCardProps> = ({ product, mediaUrl, onImageLoad = () => {} }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [cartState, setCartState] = useState<CartButtonState>("idle");

  const router = useRouter();
  const { user } = useAuthContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = isInWishlist(product.id);

  const isNew = Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000;

  const handleImageReady = () => {
    setImageLoaded(true);
    onImageLoad();
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (cartState === "loading") return;

    if (user === null) {
      router.push("/authentication/sign-in");
      return;
    }

    const hasActiveColors = productColors.some(
      (c) => c.product_id === product.id && c.active === true && c.deleted_at === null
    );
    const hasActiveSizes = productSizes.some(
      (s) => s.product_id === product.id && s.active === true && s.deleted_at === null
    );

    if (hasActiveColors || hasActiveSizes) {
      router.push(`/product-details/${product.id}`);
      return;
    }

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
      setTimeout(() => { setCartState("idle"); }, 1500);
    } catch {
      setCartState("error");
      setTimeout(() => { setCartState("idle"); }, 2000);
    }
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
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
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
              `}
            >
              {cartState === "loading" && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              )}
              {cartState === "done" && <FaCheck size={14} />}
              {(cartState === "idle" || cartState === "error") && <FaShoppingCart size={14} />}
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
1. Remove the entire cart `<button>` element (the one with `aria-label="加入购物车"`, absolute bottom-2 right-2)
2. Remove `cartState` state variable and its type `CartButtonState`
3. Remove the `handleAddToCart` function entirely
4. Remove these now-unused imports:
   - `FaShoppingCart`, `FaCheck` from `react-icons/fa`
   - `useAddToCartContext` from `@/context/product/CartContext`
   - `useAddToCartLogContext` from `@/context/product/AddToCartLogContext`
5. Remove the now-unused `createAddToCart` and `createAddToCartLog` destructuring
6. Remove the now-unused `hasActiveColors` / `hasActiveSizes` logic (it was only used in handleAddToCart)
7. Also remove the `isNew` variable if it is unused (it is — it is computed but never rendered)
8. Keep the wishlist heart button (top-left), `handleToggleWishlist`, and all other code exactly as-is
9. Keep `useProductColorContext` and `useProductSizeContext` imports only if they are still used after the removal — if not, remove them too

---

### FILE 3: `asf-2-next/src/app/authentication/sign-in/page.tsx`

**Current content:**
```tsx
"use client";
import { useParams } from "next/navigation";
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Label, TextInput } from "flowbite-react";
import type { FC } from "react";
import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import LoadingPage from "@/app/loading";

const SignInPage: FC = function () {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading } = useAuthContext();

  const [username, setUsername] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const returnTo = useMemo<string>(() => {
    const raw = searchParams.get("returnTo");
    if (typeof raw === "string" && raw.length > 0) {
      return decodeURIComponent(raw);
    }
    return "/";
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const result = await signIn(username, password);

    if (result.error) {
      console.error("Sign in error:", result.error.message);
      setError(result.error.message);
      setIsSubmitting(false);
    } else {
      router.push(returnTo);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    router.push(returnTo);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 lg:gap-y-12 bg-gray-50 dark:bg-gray-900">

      <div className="w-full max-w-[1024px] mb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
          aria-label="Go back"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      <Link href="/" className="my-4 flex items-center gap-x-1 lg:my-0">
        <img alt="Logo" src="/images/logo.svg" className="mr-3 h-10" />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          ASF
        </span>
      </Link>

      <Card
        horizontal
        imgSrc="/images/authentication/login.jpg"
        imgAlt=""
        className="w-full md:max-w-[1024px] md:[&>*]:w-full md:[&>*]:p-16 [&>img]:hidden md:[&>img]:w-96 md:[&>img]:p-0 lg:[&>img]:block">

        <h1 className="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
          Sign in to platform
        </h1>

        {error.length > 0 && (
          <div
            role="alert"
            className="mb-6 p-3 text-sm text-center text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleLogin(e)}>
          <div className="mb-4 flex flex-col gap-y-3">
            <Label htmlFor="email">Your Username / Email</Label>
            <TextInput
              id="email"
              name="email"
              placeholder="username@example.com"
              type="email"
              // @ts-ignore — standard HTML attributes, not in all Flowbite typings
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="password">Your password</Label>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <Button
              type="submit"
              className="w-full lg:w-auto"
              disabled={isSubmitting}
              isProcessing={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Login to your account"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignInPage;
```

**Required changes:**
1. Change `React.useState<string>("")` for `username` initial value to `"stanley121499@gmail.com"`
2. Change `React.useState<string>("")` for `password` initial value to `"12345678"`
3. Translate all visible UI strings to Chinese:
   - `aria-label="Go back"` → `aria-label="返回"`
   - `<span>Back</span>` → `<span>返回</span>`
   - `"Sign in to platform"` → `"登录平台"`
   - `"Your Username / Email"` → `"邮箱地址"`
   - `placeholder="username@example.com"` → `placeholder="请输入邮箱地址"`
   - `"Your password"` → `"密码"`
   - `placeholder="••••••••"` stays as-is (it's a visual placeholder, no translation needed)
   - `"Signing in…"` → `"登录中…"`
   - `"Login to your account"` → `"登录账户"`
4. Remove the unused `useParams` import (it is imported but never used)
5. Remove the unused `usePathname` import (it is imported but never used)
6. Keep all logic, error handling, and structure exactly as-is

---

**Output:** Provide the complete updated content for all 3 files.

---

---

## PROMPT 2 — Back Buttons + Product Details Save Icon

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 app (App Router) located at `asf-2-next/src/`.
The app uses TypeScript (strict), Tailwind CSS, Flowbite React, Supabase, and react-icons.

You must follow these coding rules without exception:
- No `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `@/` concatenation
- Generate complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will make changes to **2 files**. Return the complete updated content of each file.

---

### FILE 1: `asf-2-next/src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`

**Current content:**
```tsx
"use client";
import { useParams } from "next/navigation";

import { Select } from "flowbite-react";
import React, { useEffect, useState, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import type { Tables } from "@/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import Link from "next/link";

const ProductCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div className="h-56 w-full rounded-t-lg bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

interface ProductSectionClientProps {
  initialCategoryId?: string;
  products: Tables<"products">[];
  categories: Tables<"categories">[];
  productMedias: Tables<"product_medias">[];
}

const ProductSectionClient: React.FC<ProductSectionClientProps> = ({
  initialCategoryId,
  products,
  categories,
  productMedias,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const departmentId = searchParams.get("department");
  const rangeId = searchParams.get("range");
  const brandId = searchParams.get("brand");

  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((category) => category.id === initialCategoryId)
  );
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [selectedFilter, setSelectedFilter] = useState(
    selectedCategory?.name || "All"
  );

  useEffect(() => {
    const category = categories.find((c) => c.id === initialCategoryId);
    setSelectedCategory(category);
    if (departmentId || rangeId || brandId) {
      setSelectedFilter("All");
    } else {
      setSelectedFilter(category?.name || "All");
    }
  }, [categories, initialCategoryId, departmentId, rangeId, brandId]);

  const handleFilterChange = (filterName: string) => {
    setSelectedFilter(filterName);
    if (filterName === "All") {
      router.push("/product-section");
      setSelectedCategory(undefined);
    } else {
      const category = categories.find((cat) => cat.name === filterName);
      if (category) {
        router.push(`/product-section/${category.id}`);
        setSelectedCategory(category);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const afterFiltersAndSort = products
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
          return (a.price ?? 0) - (b.price ?? 0);
        } else if (selectedSort === "Price: High to Low") {
          return (b.price ?? 0) - (a.price ?? 0);
        } else {
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        }
      });

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

  const productMediaMap = useMemo(() => {
    return new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""]));
  }, [productMedias]);

  return (
    <>
      <NavbarHome />
      <section className="bg-gray-50 antialiased dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 pt-4 pb-12">
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                      <Link
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
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
                        </svg>
                        <Link href="/product-section" className="ms-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white md:ms-2">
                          商品
                        </Link>
                      </div>
                    </li>
                    {selectedCategory && (
                      <li aria-current="page">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-400 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
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

          <div className="mb-4 grid gap-4 grid-cols-2">
            {filteredProducts.map((product) => {
              const mediaUrl = productMediaMap.get(product.id) || "/default-image.jpg";
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  mediaUrl={mediaUrl}
                  onImageLoad={() => {}}
                />
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 py-16 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery.trim().length > 0
                    ? `未找到与 "${searchQuery}" 相关的商品`
                    : "此分类暂无商品"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductSectionClient;
```

**Required changes:**
1. Add a back button row between `<NavbarHome />` and `<section ...>`. Use `router.back()`.
   Style it as: a `<div>` with `px-4 pt-3 pb-1 bg-gray-50 dark:bg-gray-900` containing a
   `<button>` with `HiOutlineArrowLeft` icon and "返回" text. Same styling as the auth page
   back button: `inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800`.
2. Import `HiOutlineArrowLeft` from `"react-icons/hi"`
3. Remove the unused `useParams` import if present
4. Keep everything else exactly as-is

---

### FILE 2: `asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`

**Current content:**
```tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavbarHome from "@/components/navbar-home";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import { useAlertContext } from "@/context/AlertContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAddToCartLogContext } from "@/context/product/AddToCartLogContext";
import { useAuthContext } from "@/context/AuthContext";
import { isSoftDeletedRow, readDeletedAt } from "@/utils/softDeleteRuntime";
import type { Tables } from "@/database.types";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlistContext } from "@/context/WishlistContext";

interface ProductDetailsClientProps {
  productId: string;
  initialProduct: Tables<"products"> | null;
  productMedias: Tables<"product_medias">[];
  productColors: Tables<"product_colors">[];
  productSizes: Tables<"product_sizes">[];
  productStocks: Tables<"product_stock">[];
}

const ProductDetailsClient: React.FC<ProductDetailsClientProps> = ({
  productId,
  initialProduct,
  productMedias,
  productColors,
  productSizes,
  productStocks,
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { createAddToCart } = useAddToCartContext();
  const { createAddToCartLog } = useAddToCartLogContext();

  const product = initialProduct;

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const isSaved = product !== null ? isInWishlist(product.id) : false;

  // ... (availability, sortedProductMedia, activeColors, activeSizes, selectedColor,
  // selectedSize, selectedImageIndex, currentStockRow, handleAddToCart, beforeBuyNow,
  // handleToggleWishlist — all remain unchanged in the full file)

  // NOTE: The full file is 531 lines. The key changes are:
  // 1. Add back button between <NavbarHome /> and <section>
  // 2. Change FaHeart/FaRegHeart to FaBookmark/FaRegBookmark
  // 3. Restructure the title + wishlist button into a flex justify-between row
```

> **Note to agent:** The full `ProductDetailsClient.tsx` file is 531 lines. Read the file
> at `asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`
> before making changes.

**Required changes:**

**Change A — Back button:**
Add a back button row immediately after `<NavbarHome />` and before `<section ...>` in the
main render (not in the deleted/missing guard block — add it there too).
Style: same as in ProductSectionClient (see above).
Import `HiOutlineArrowLeft` from `"react-icons/hi"`.

**Change B — Save icon from heart to bookmark:**
- Replace `import { FaHeart, FaRegHeart } from "react-icons/fa"` with
  `import { FaBookmark, FaRegBookmark } from "react-icons/fa"`
- In the wishlist button JSX (currently a standalone `<button>` below `<h1>`):
  - Replace `<FaHeart size={16} className="text-red-500" />` with
    `<FaBookmark size={16} className="text-indigo-600" />`
  - Replace `<FaRegHeart size={16} />` with
    `<FaRegBookmark size={16} className="text-gray-500 dark:text-gray-400" />`

**Change C — Reposition save button inline with product name:**
The current structure around the product name is:
```tsx
<h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
  {product.name}
</h1>
<button
  type="button"
  onClick={() => void handleToggleWishlist()}
  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
>
  {isSaved ? <FaHeart size={16} className="text-red-500" /> : <FaRegHeart size={16} />}
  {isSaved ? "已收藏" : "收藏"}
</button>
```

Replace this with:
```tsx
<div className="flex justify-between items-start gap-3">
  <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
    {product.name}
  </h1>
  <button
    type="button"
    onClick={() => void handleToggleWishlist()}
    aria-label={isSaved ? "从收藏中移除" : "添加到收藏"}
    className="mt-1 flex-shrink-0 p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
  >
    {isSaved
      ? <FaBookmark size={18} className="text-indigo-600" />
      : <FaRegBookmark size={18} className="text-gray-500 dark:text-gray-400" />
    }
  </button>
</div>
```

Remove the text labels "已收藏" / "收藏" — the icon alone is sufficient.

---

**Output:** Provide the complete updated content for both files.

---

---

## PROMPT 3 — HomeHighlightsCard Component

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 app (App Router) located at `asf-2-next/src/`.
The app uses TypeScript (strict), Tailwind CSS, and react-icons.

You must follow these coding rules without exception:
- No `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Generate complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will make changes to **1 file**. Return the complete updated content.

---

### FILE: `asf-2-next/src/components/home/HomeHighlightsCard.tsx`

**Current content:**
```tsx
import React from "react";
import Link from "next/link";
import MediaThumb from "../MediaThumb";

export interface HomeHighlightsCardProps {
  to: string;
  imageUrl?: string | null;
  title: string;
  subtitle: string;
  badgeText?: string;
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

function resolveImageUrl(
  imageUrl: string | null | undefined,
  fallbackImageUrl: string | undefined
): string {
  if (typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    return imageUrl;
  }
  if (typeof fallbackImageUrl === "string" && fallbackImageUrl.trim().length > 0) {
    return fallbackImageUrl;
  }
  return FALLBACK_PLACEHOLDER_IMAGE;
}

export function HomeHighlightsCard({
  to,
  imageUrl,
  title,
  subtitle,
  badgeText,
  imageAlt,
  ctaText = "Discover More →",
  className = "",
  fallbackImageUrl,
}: HomeHighlightsCardProps): JSX.Element {
  const resolvedImageUrl = resolveImageUrl(imageUrl, fallbackImageUrl);
  const resolvedAlt = typeof imageAlt === "string" && imageAlt.trim().length > 0 ? imageAlt : title;

  return (
    <Link
      href={to}
      className={[
        "flex-shrink-0 w-68 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group",
        className,
      ].join(" ")}
      style={{ width: "17rem" }}
    >
      {typeof badgeText === "string" && badgeText.trim().length > 0 && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-700 to-purple-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
          {badgeText}
        </div>
      )}

      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <MediaThumb
          src={resolvedImageUrl}
          alt={resolvedAlt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      <div className="p-5 relative">
        <h3 className="font-bold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">{subtitle}</p>
        <div className="mt-4 flex justify-end">
          <span className="text-xs text-indigo-700 font-medium">{ctaText}</span>
        </div>
      </div>
    </Link>
  );
}
```

**Required changes:**

**Change A — Replace `badgeText` with bell icon props:**
- Remove the `badgeText?: string` prop from `HomeHighlightsCardProps`
- Add two new props:
  - `showBell?: boolean` — when `true`, show a bell icon button at top-right
  - `onBellDismiss?: (e: React.MouseEvent<HTMLButtonElement>) => void` — called when bell is tapped
- Replace the `badgeText` badge `<div>` with a bell button:
  ```tsx
  {showBell === true && (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onBellDismiss?.(e);
      }}
      aria-label="标记为已读"
      className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"
    >
      <FaBell size={13} />
    </button>
  )}
  ```
- Import `FaBell` from `"react-icons/fa"`

**Change B — Add save/bookmark button to card footer:**
- Add two new props to `HomeHighlightsCardProps`:
  - `isSaved?: boolean` — whether the item is currently saved
  - `onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void` — called when save is tapped
- In the card footer `<div className="mt-4 flex justify-end">`, change it to
  `<div className="mt-4 flex justify-between items-center">` and add a save button before
  the CTA span:
  ```tsx
  <div className="mt-4 flex justify-between items-center">
    {onSave !== undefined ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSave(e);
        }}
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
  ```
- Import `FaBookmark, FaRegBookmark` from `"react-icons/fa"`

**Summary of new props interface:**
```tsx
export interface HomeHighlightsCardProps {
  to: string;
  imageUrl?: string | null;
  title: string;
  subtitle: string;
  // badgeText is REMOVED
  showBell?: boolean;
  onBellDismiss?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  imageAlt?: string;
  ctaText?: string;
  className?: string;
  fallbackImageUrl?: string;
}
```

---

**Output:** Provide the complete updated content for the file.

---

---

## PROMPT 4 — HomePageClient (Main Home Page)

> **Paste this entire block as your prompt.**

---

You are working on a Next.js 14 app (App Router) located at `asf-2-next/src/`.
The app uses TypeScript (strict), Tailwind CSS, Supabase, and react-icons.

You must follow these coding rules without exception:
- No `any` type, no non-null assertion (`!`), no `as unknown as T`
- Double quotes `"` for all strings
- String templates or `.join()` instead of `+` concatenation
- Generate complete files — no placeholders, no `// ... rest of code`
- Comments only for non-obvious logic, not narration

You will make changes to **1 file**: `asf-2-next/src/app/(customer)/_components/HomePageClient.tsx`.

Read the full current file before making any changes.

**Context — what changed in previous prompts:**
- `navbar-home.tsx` no longer renders `SearchOverlay` or manages `isSearchOpen` state.
  `HomePageClient` must now own this.
- `HomeHighlightsCard` now accepts these props (replacing `badgeText`):
  `showBell`, `onBellDismiss`, `isSaved`, `onSave`
  See updated interface:
  ```tsx
  showBell?: boolean;
  onBellDismiss?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ```

**Context — WishlistContext API (already in the file's context bundle):**
```tsx
const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
// isInWishlist(productId: string): boolean
// addToWishlist(productId: string): Promise<void>
// removeFromWishlist(productId: string): Promise<void>
// Note: This only works for product IDs (DB foreign key to products table).
// Posts/categories/brands/depts/ranges must use localStorage.
```

**Context — localStorage helpers to add inside the component:**

For saved non-product items (posts, categories, brands, departments, ranges), use a
localStorage key `"saved_items"` storing a JSON array of strings in `"type:id"` format.
Helper pattern:
```tsx
const [localSavedItems, setLocalSavedItems] = useState<Set<string>>(() => {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem("saved_items");
    return new Set<string>(raw !== null ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
});

const toggleLocalSaved = (key: string): void => {
  setLocalSavedItems((prev) => {
    const next = new Set<string>(prev);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    try {
      localStorage.setItem("saved_items", JSON.stringify([...next]));
    } catch {
      // localStorage not available
    }
    return next;
  });
};
```

For the bell dismissed state, use localStorage key `"dismissed_bells"`:
```tsx
const [dismissedBells, setDismissedBells] = useState<Set<string>>(() => {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem("dismissed_bells");
    return new Set<string>(raw !== null ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
});

const dismissBell = (id: string): void => {
  setDismissedBells((prev) => {
    const next = new Set<string>(prev);
    next.add(id);
    try {
      localStorage.setItem("dismissed_bells", JSON.stringify([...next]));
    } catch {
      // localStorage not available
    }
    return next;
  });
};
```

---

### Required changes to `HomePageClient.tsx`:

**Change 1 — Add SearchOverlay + state (item #4 from the plan):**
- Add `import SearchOverlay from "@/components/SearchOverlay"`
- Add `import { FaSearch } from "react-icons/fa"` (may already be imported)
- Add `const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)` inside the component
- Render `<SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />`
  at the bottom of the JSX (just before or after `<AnnouncementBottomSheet />`).

**Change 2 — Update `ScrollableSection` to support search button (item #4):**
Update the `ScrollableSectionProps` interface to add:
```tsx
onSearch?: () => void;
```
In the `ScrollableSection` render, after the "查看全部" link (or in place of it if not present),
add a search icon button when `onSearch` is provided:
```tsx
{onSearch !== undefined && (
  <button
    type="button"
    onClick={onSearch}
    aria-label="搜索"
    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors ml-2"
  >
    <FaSearch className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
  </button>
)}
```
Pass `onSearch={() => setIsSearchOpen(true)}` to **every** `<ScrollableSection>` call.

**Change 3 — Remove login block from points card (item #3):**
Delete the entire `{!user && (...)}` block — the `<Link href="/authentication/sign-in?returnTo=%2F">` block inside the hero card. Nothing else in the hero card changes.

**Change 4 — Add localStorage state for saved items + bell (items #5, #6):**
Add the `localSavedItems`, `toggleLocalSaved`, `dismissedBells`, and `dismissBell` helpers
described in the context section above.

**Change 5 — Wire bell + save to highlight post cards (items #5, #6):**
The inline highlight post cards are rendered inside the first `ScrollableSection` (title "精选推荐").
Currently they have a hardcoded "精选" badge div at top-right. Replace this with:
```tsx
{!dismissedBells.has(post.id) && (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissBell(post.id);
    }}
    aria-label="标记为已读"
    className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md hover:opacity-90 transition-opacity"
  >
    <FaBell size={13} />
  </button>
)}
```
Import `FaBell` from `"react-icons/fa"` (may already be imported).

Also add a save button to the bottom of each inline post card. After the `<div className="mt-4 flex justify-end">` containing "了解更多 →", change it to:
```tsx
<div className="mt-4 flex justify-between items-center">
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleLocalSaved(`post:${post.id}`);
    }}
    aria-label={localSavedItems.has(`post:${post.id}`) ? "取消收藏" : "收藏"}
    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-gray-100"
  >
    {localSavedItems.has(`post:${post.id}`)
      ? <FaBookmark size={13} className="text-indigo-600" />
      : <FaRegBookmark size={13} className="text-gray-400" />
    }
  </button>
  <span className="text-xs text-indigo-700 font-medium">了解更多 →</span>
</div>
```
Import `FaBookmark, FaRegBookmark` from `"react-icons/fa"`.

**Change 6 — Wire bell + save to HomeHighlightsCard sections (items #5, #6):**
For every `<HomeHighlightsCard>` rendered in the 分类, 部门, 系列, 品牌 sections, add:
- `showBell={!dismissedBells.has(`ITEMTYPE:${item.id}`)}`
  (e.g. `showBell={!dismissedBells.has(`category:${category.id}`)}`)
- `onBellDismiss={() => dismissBell(`category:${category.id}`)}`
- `isSaved={localSavedItems.has(`category:${category.id}`)}`
- `onSave={() => toggleLocalSaved(`category:${category.id}`)}`

Use the appropriate type prefix per section:
- 分类 → `"category"`
- 部门 → `"department"`
- 系列 → `"range"`
- 品牌 → `"brand"`

Remove `badgeText` prop from all `<HomeHighlightsCard>` usages (it no longer exists).

**Change 7 — Wire save to inline product cards (item #5):**
The inline product cards at the bottom ("商品" section) are `<Link>` elements rendered inline
in the last `ScrollableSection`. They currently have a `+` circle icon at bottom-right inside
the `<div className="p-4">` footer.

The product section currently renders:
```tsx
<div className="flex justify-between items-center mt-2">
  <p className="text-sm font-bold text-indigo-800">
    RM {product.price?.toFixed(2) ?? "—"}
  </p>
  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
    <svg ...>  {/* + icon */}
    </svg>
  </div>
</div>
```

Add a save button below this row (still inside the `<div className="p-4">`):
```tsx
<div className="mt-2 flex justify-end">
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isInWishlist(product.id)) {
        void removeFromWishlist(product.id);
      } else {
        void addToWishlist(product.id);
      }
    }}
    aria-label={isInWishlist(product.id) ? "取消收藏" : "收藏"}
    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-gray-100"
  >
    {isInWishlist(product.id)
      ? <FaBookmark size={13} className="text-indigo-600" />
      : <FaRegBookmark size={13} className="text-gray-400" />
    }
  </button>
</div>
```

This uses the real `useWishlistContext` since these are actual product IDs.
Add `const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();`
and import `useWishlistContext` from `"@/context/WishlistContext"`.

---

**Output:** Provide the complete updated content for `HomePageClient.tsx`.

---
