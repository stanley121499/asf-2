"use client";

import React, { useEffect, useState, useMemo } from "react";
import NavbarHome from "@/components/navbar-home";
import type { Tables } from "@/database.types";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import { HiOutlineSearch, HiX } from "react-icons/hi";
import Link from "next/link";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useAuthContext } from "@/context/AuthContext";

const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col">
    <div className="w-full pt-[133.33%] bg-gray-200 animate-pulse" />
    <div className="pt-3 space-y-2">
      <div className="h-4 w-3/4 bg-gray-200 animate-pulse" />
      <div className="h-4 w-1/3 bg-gray-200 animate-pulse" />
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
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Tables<"products"> | null>(null);

  const { user } = useAuthContext();
  const { createAddToCart } = useAddToCartContext();

  useEffect(() => {
    const category = categories.find((c) => c.id === initialCategoryId);
    setSelectedCategory(category);
    if (departmentId || rangeId || brandId) {
      setSelectedFilter("All");
    } else {
      setSelectedFilter(category?.name || "All");
    }
  }, [categories, initialCategoryId, departmentId, rangeId, brandId]);

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

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
  };

  const handleQuickViewAddCart = async () => {
    if (!quickViewProduct) return;
    
    // For demo: if we don't have variant info, route to PDP for safety
    // router.push(`/product-details/${quickViewProduct.id}`);
    
    try {
      if (!user?.id) {
        router.push("/authentication/sign-in");
        return;
      }
      await createAddToCart({
        product_id: quickViewProduct.id,
        user_id: user.id,
        amount: 1,
      });
      setQuickViewProduct(null);
    } catch {
      // ignore
    }
  };

  const CATEGORY_NAMES: Record<string, string> = {
    "Handbag": "手袋",
    "Streetwear": "街头服饰",
    "Spring Collection": "春季新品",
    "Ladies": "女装",
    "Men": "男装",
    "Accessories": "配饰",
    "Shoes": "鞋履",
    "Beauty": "美妆",
    "Pants": "长裤",
    "Tops": "上衣",
    "Bottoms": "下装"
  };

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-white pb-[64px] flex flex-col">
        {/* Sticky Search & Nav block */}
        <div className="sticky top-[56px] z-30 bg-white border-b border-[var(--color-border)]">
          {/* Sticky search bar */}
          <div className="px-4 py-3">
            <div className="relative w-full h-[48px] bg-[var(--color-panel)] rounded-full flex items-center px-4">
              <HiOutlineSearch className="h-5 w-5 text-[var(--color-muted)] mr-2 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索商品…"
                className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--color-text)] outline-none w-full"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 gap-2">
            <Link
              href="/product-section"
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
                !selectedCategory ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]' : 'bg-white text-[var(--color-text)] border-[var(--color-border)]'
              }`}
            >
              全部
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/product-section/${cat.id}`}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border ${
                  selectedCategory?.id === cat.id ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]' : 'bg-white text-[var(--color-text)] border-[var(--color-border)]'
                }`}
              >
                {CATEGORY_NAMES[cat.name || ""] ?? cat.name}
              </Link>
            ))}
          </div>
          
          {/* Sort & Filter Strip */}
          <div className="px-4 pb-3 flex justify-end">
            <button 
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)]"
            >
              筛选 ⚙
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-4 py-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-display text-xl text-[var(--color-text)] mb-2">暂无相关商品</p>
              <button 
                onClick={() => router.push('/')}
                className="btn-primary rounded-xl max-w-[200px] mt-4"
              >
                回到首页
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mediaUrl={productMediaMap.get(product.id) || "/default-image.jpg"}
                  onQuickView={() => setQuickViewProduct(product)}
                  priority={index < 2}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterSheetOpen(false)} />
          <div className="relative bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-[var(--color-text)]">排序方式</h3>
              <button onClick={() => setIsFilterSheetOpen(false)}>
                <HiX size={24} className="text-[var(--color-muted)]" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              {[
                { label: "最新", value: "Newest First" },
                { label: "价格从低到高", value: "Price: Low to High" },
                { label: "价格从高到低", value: "Price: High to Low" }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={selectedSort === opt.value}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-5 h-5 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-gray-300"
                  />
                  <span className="text-base text-[var(--color-text)]">{opt.label}</span>
                </label>
              ))}
            </div>

            <button 
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-full btn-primary rounded-xl"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {/* Quick View Bottom Sheet */}
      {quickViewProduct && (() => {
        const mediaUrl = productMediaMap.get(quickViewProduct.id) || "/default-image.jpg";
        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setQuickViewProduct(null)} />
            <div className="relative bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-full">
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 bg-[var(--color-panel)] rounded-full p-1 z-10"
              >
                <HiX size={20} className="text-[var(--color-text)]" />
              </button>
              
              <div className="flex gap-4 mb-6 mt-2">
                <div className="relative w-[100px] pt-[150%] bg-[var(--color-panel)] rounded-lg overflow-hidden shrink-0">
                  <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-sans font-medium text-lg text-[var(--color-text)]">{quickViewProduct.name}</h3>
                  <p className="text-[var(--color-accent)] font-medium mt-1">
                    RM {quickViewProduct.price?.toFixed(2) ?? "—"}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleQuickViewAddCart}
                className="w-full btn-primary rounded-xl"
              >
                加入购物袋
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default ProductSectionClient;
