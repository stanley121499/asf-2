"use client";

import { Select } from "flowbite-react";
import React, { useEffect, useState, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import type { Tables } from "@/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/home/ProductCard"; // Adjusted import path from what might have been local to home/components
import { HiOutlineArrowLeft } from "react-icons/hi";

// Use the local ProductCard Skeleton logic slightly adapted for Next.js

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

  const productMediaMap = useMemo(() => {
    return new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""]));
  }, [productMedias]);

  return (
    <>
      <NavbarHome />
      <div className="px-4 pt-3 pb-1 bg-gray-50 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label="返回"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
      </div>
      <section className="bg-gray-50 antialiased dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 pt-4 pb-12">
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
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
