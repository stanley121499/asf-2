"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Dropdown, Tooltip } from "flowbite-react";
import Link from "next/link";
import Image from "next/image";
import {
  HiDotsVertical,
  HiOutlineHeart,
  HiOutlineShoppingCart,
  HiOutlineTrash,
} from "react-icons/hi";
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

/**
 * WishlistPage displays the authenticated user's wishlist using WishlistContext.
 * All data is real (no mock data) and is protected by RLS server-side.
 */
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

  /**
   * Build a fast lookup from product id -> primary media URL.
   * We choose the media with the smallest `arrangement` (null treated as 0).
   */
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

  /**
   * Build category id -> name lookup so we can render a friendly label.
   */
  const categoryNameById = useMemo<Record<string, string>>(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  /**
   * Convert wishlist rows into a display model for this page.
   */
  const displayItems = useMemo<DisplayWishlistItem[]>(() => {
    return wishlistItems
      .map((item) => {
        const productId = item.product_id;
        if (typeof productId !== "string" || productId.length === 0) {
          return null;
        }

        const product = item.product;
        const name = typeof product?.name === "string" && product.name.length > 0 ? product.name : "未知商品";
        const price = typeof product?.price === "number" && Number.isFinite(product.price) ? product.price : 0;

        const categoryId = typeof product?.category_id === "string" ? product.category_id : null;
        const category =
          categoryId && typeof categoryNameById[categoryId] === "string"
            ? categoryNameById[categoryId]
            : "未分类";

        const addedOn = typeof item.created_at === "string" ? item.created_at : "";

        const inStock = typeof product?.stock_count === "number" ? product.stock_count > 0 : false;
        const imageUrl =
          typeof primaryImageByProductId[productId] === "string" && primaryImageByProductId[productId].length > 0
            ? primaryImageByProductId[productId]
            : "/default-image.jpg";

        return {
          wishlistId: item.id,
          productId,
          name,
          price,
          category,
          addedOn,
          inStock,
          imageUrl,
        };
      })
      .filter((v): v is DisplayWishlistItem => v !== null);
  }, [categoryNameById, primaryImageByProductId, wishlistItems]);

  /**
   * Derived category list for the filter UI.
   */
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
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
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

  /**
   * Format a Supabase timestamp string for display.
   */
  const formatDate = useCallback((dateString: string): string => {
    if (typeof dateString !== "string" || dateString.length === 0) return "未知";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "未知";

    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleRemove = useCallback(
    async (productId: string): Promise<void> => {
      await removeFromWishlist(productId);
    },
    [removeFromWishlist]
  );

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

  const handleAddAllToCart = useCallback((): void => {
    // This is intentionally not implemented as part of the wishlist backend feature.
    // The cart flow has its own context and variant rules.
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
                  <Badge color="gray" className="ml-3">
                    {displayItems.length} 件商品
                  </Badge>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  收藏您喜爱的商品，稍后再来查看
                </p>
              </div>

              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mt-4 md:mt-0 w-full md:w-auto">
                <div className="flex space-x-2">
                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" ? "全部" : category}
                      </option>
                    ))}
                  </select>

                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                  >
                    <option value="addedOn">最新优先</option>
                    <option value="priceAsc">价格：从低到高</option>
                    <option value="priceDesc">价格：从高到低</option>
                    <option value="nameAsc">名称：A 到 Z</option>
                    <option value="nameDesc">名称：Z 到 A</option>
                  </select>
                </div>

                <Button color="blue" onClick={handleAddAllToCart} disabled={loading || displayItems.length === 0}>
                  <HiOutlineShoppingCart className="mr-2 h-5 w-5" />
                  全部加入购物车
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-600 dark:text-gray-300">
                正在加载收藏...
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
                  <HiOutlineHeart className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  您的收藏为空
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  添加到收藏的商品将在此处显示
                </p>
                <Link href="/product-section">
                  <Button color="blue">开始购物</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
                  <div
                    key={item.wishlistId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <Link href={`/product-details/${item.productId}`}>
                        {/* Use next/image for automatic resizing — avoids downloading full 2MB originals */}
                        <div className="relative w-full h-48">
                          <Image
                            src={item.imageUrl || "/default-image.jpg"}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      <div className="absolute top-2 right-2">
                        <Dropdown
                          label={<HiDotsVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                          arrowIcon={false}
                          inline
                        >
                          <Dropdown.Item onClick={() => void handleRemove(item.productId)}>
                            <div className="flex items-center">
                              <HiOutlineTrash className="mr-2 h-4 w-4" />
                              移除
                            </div>
                          </Dropdown.Item>
                        </Dropdown>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <Link href={`/product-details/${item.productId}`} className="hover:text-blue-600">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                        </Link>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          添加于 {formatDate(item.addedOn)}
                        </span>
                        <span
                          className={[
                            "text-xs font-medium",
                            item.inStock ? "text-green-600" : "text-red-600",
                          ].join(" ")}
                        >
                          {item.inStock ? "有货" : "缺货"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          RM {item.price.toFixed(2)}
                        </span>
                        <div>
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
                            <Tooltip content="此商品目前缺货">
                              <Button size="xs" color="gray" disabled>
                                缺货
                              </Button>
                            </Tooltip>
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