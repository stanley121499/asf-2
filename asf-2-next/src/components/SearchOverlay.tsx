"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { useProductContext } from "@/context/product/ProductContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";

interface SearchOverlayProps {
  /** Whether the overlay is currently visible */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { products } = useProductContext();
  const { productMedias } = useProductMediaContext();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Add a small delay for the browser to render the input before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const productMediaMap = useMemo(() => {
    const map = new Map<string, string>();
    productMedias.forEach((media) => {
      // Keep first encountered or lowest arrangement
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b flex items-center gap-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <FaSearch className="text-gray-400 w-5 h-5 flex-shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索商品..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 p-2"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭搜索"
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        onClick={onClose} // Clicking the backdrop area closes the overlay
      >
        <div 
          className="max-w-3xl mx-auto flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside results from closing
        >
          {searchQuery.trim().length === 0 ? (
            <div className="py-20 text-center text-gray-400 dark:text-gray-500">
              输入商品名称开始搜索
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center text-gray-500 dark:text-gray-400">
              未找到与 "{searchQuery}" 相关的商品
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleResultClick(product.id)}
                  className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                  <img
                    src={productMediaMap.get(product.id) || "/default-image.jpg"}
                    alt={product.name || "Product"}
                    className="w-10 h-10 object-cover rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0"
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-300 flex-shrink-0">
                    RM {(product.price ?? 0).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
