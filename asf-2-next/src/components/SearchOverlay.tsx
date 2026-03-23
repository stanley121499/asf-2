"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HiX } from "react-icons/hi";
import { useProductContext } from "@/context/product/ProductContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";
import Image from "next/image";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = ["连衣裙", "夏季新品", "基础款T恤", "配饰", "手袋", "运动鞋"];

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const productMediaMap = useMemo(() => {
    const map = new Map<string, string>();
    productMedias.forEach((media) => {
      if (!map.has(media.product_id) && media.media_url) {
        map.set(media.product_id, media.media_url);
      }
    });
    return map;
  }, [productMedias]);

  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((product) => {
        const name = (product.name ?? "").toLowerCase();
        const description = (product.description ?? "").toLowerCase();
        const articleNumber = (product.article_number ?? "").toLowerCase();
        return name.includes(query) || description.includes(query) || articleNumber.includes(query);
      })
      .slice(0, 20);
  }, [products, searchQuery]);

  const handleResultClick = (productId: string) => {
    router.push(`/product-details/${productId}`);
    onClose();
  };

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)] pt-safe-area">
      <div className="px-4 py-3 flex items-center border-b border-[var(--color-border)]">
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索商品..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--color-text)] font-display text-lg placeholder:text-[var(--color-muted)] p-0"
        />
        <button
          onClick={onClose}
          className="ml-4 p-2 text-[var(--color-text)]"
        >
          <HiX size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {searchQuery.trim().length === 0 ? (
          <div className="p-6">
            <h3 className="text-sm font-medium text-[var(--color-muted)] mb-4 tracking-wider">热门搜索</h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingClick(term)}
                  className="bg-[var(--color-panel)] border border-[var(--color-border)] px-4 py-2 rounded-full text-sm text-[var(--color-text)]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-12 text-center text-[var(--color-muted)]">
            未找到与 "{searchQuery}" 相关的商品
          </div>
        ) : (
          <div className="flex flex-col">
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleResultClick(product.id)}
                className="flex items-center gap-4 p-4 border-b border-[var(--color-border)] last:border-0"
              >
                <div className="w-16 h-[85px] shrink-0 bg-gray-100 rounded overflow-hidden relative">
                  <Image
                    src={productMediaMap.get(product.id) || "/default-image.jpg"}
                    alt={product.name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 text-left justify-center">
                  <span className="text-sm font-medium text-[var(--color-text)] line-clamp-1 mb-1">
                    {product.name}
                  </span>
                  <span className="text-sm text-[var(--color-muted)]">
                    RM {(product.price ?? 0).toFixed(2)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
