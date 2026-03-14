"use client";

import { Select } from "flowbite-react";
import React, { useEffect, useState, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import type { Tables } from "@/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/home/ProductCard"; // Adjusted import path from what might have been local to home/components
import Link from "next/link"; // Next.js link

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
    return products
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
  }, [products, selectedCategory, departmentId, rangeId, brandId, selectedSort]);

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
                        <Link
                          href="/product-section"
                          className="ms-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white md:ms-2">
                          商品
                        </Link>
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
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductSectionClient;
